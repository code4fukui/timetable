import cheerio from 'cheerio'
import util from './util.js'
//import util from './util.mjs'
import fs from 'fs'
import fetch from 'node-fetch'

const URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdsFYLU6roC8Y-PB-7MSJxxVByBh-fQxpa-Bcf0Hatykrv8M20ZQ0NAwFF5MBjw7qTZ2NnKRNEBNeP/pub?gid=0&single=true&output=csv'


const fetchCSVtoJSON = async url => util.csv2json(util.decodeCSV(await (await fetch(url)).text()))
const copyJSON = d => JSON.parse(JSON.stringify(d))
const setJSON = function(dst, src) {
  for (const name in src) {
    dst[name] = src[name]
  }
  return dst
}
const main = async function() {
  const url = URL
  const path = '../data/'

  const fn = 'funs'

  const list = await fetchCSVtoJSON(url)
  const data = []
  for (const item of list) {
    const items = await fetchCSVtoJSON(item.URL)
    const d = setJSON({}, item)
    for (const a of items) {
      const d2 = copyJSON(d)
      setJSON(d2, a)
      data.push(d2)
    }
  }
  console.log(data)
  util.writeCSV(path + fn, util.json2csv(data))
}
if (process.argv[1].endsWith('/makedata.mjs')) {
  main()
} else {
}
