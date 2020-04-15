import cheerio from 'cheerio'
import util from './util.js'
//import util from './util.mjs'
import fs from 'fs'
import fetch from 'node-fetch'

const URL = 'https://pcn.club/channel/'

// 令和2年2月27日 -> 2020-02-27 or null
const parseDate = function(s) {
  s = util.toHalf(s)
  const num = s.match(/令和(\d+)年(\d+)月(\d+)日/)
  if (!num)
    return null
  const y = 2018 + parseInt(num[1])
  const m = parseInt(num[2])
  const d = parseInt(num[3])
  return y + "-" + util.fix0(m, 2) + "-" + util.fix0(d, 2)
}
const parseTextHTML = function(dom, tag, key) {
  let res = null
  dom(tag).each((idx, ele) => {
    if (res)
      return
    const text = dom(ele).text()
    if (text.indexOf(key) >= 0)
      res = text
  })
  return res
}
const parseDLsFromHTML = function(dom) {
  const tbl = []
  const extract = function(ele) {
    const ch = dom(ele).children()
    if (ch.length == 0)
      return dom(ele).text()
    const c = ch[0]
    console.log(c)
    if (c.type == 'tag' && c.name == 'iframe') {
      return dom(c).attr('src')
    }
    //process.exit(0)
    return dom(ele).text()
  }
  const tbls = []
  dom('div', null, null).each((idx, div) => {
    const lines = []
    dom('dl', null, div).each((idx, dl) => {
      const line = []
      dom('dt', null, dl).each((idx, ele) => line.push(extract(ele)))
      dom('dd', null, dl).each((idx, ele) => line.push(extract(ele)))
      lines.push(line)
    })
    tbls.push(lines)
  })
  return tbls
}
const main = async function() {
  const url = URL
  const path = '../data/pcnchannel/'

  const fnindex = 'index.csv'

  const list = []
  /*
  try {
    list = util.csv2json(util.decodeCSV(fs.readFileSync(path + fnndex, 'utf-8')))
  } catch (e) {
  }
  */

  //const html = fs.readFileSync(path + fn, 'utf-8')
  const html = await (await fetch(url)).text()
  const dom = cheerio.load(html)
  //const title = parseTextHTML(dom, 'h3', '市町別感染者数')
  /*
  if (!exists) {
    list.push({ title: title + " - 石川県／新型コロナウイルス感染症の県内の患者発生状況", lastUpdate: dt, csv: fncsv, src_url: URL })
    fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(util.json2csv(list))), 'utf-8')
  }
  */
  const tbls = parseDLsFromHTML(dom)
  console.log(tbls)
  const tbl = []
  for (const t of tbls) {
    for (const d of t) {
      tbl.push(d)
    }
  }
  fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(util.json2csv(tbl))))

  /*
  if (tbls.length > 0 ) {
    const tbl = tbls[0]
    tbl[0][0] = '市町'
    fs.writeFileSync(path + fncsv, util.addBOM(util.encodeCSV(tbl)))
  }
  */
}
if (process.argv[1].endsWith('/pcnchannel.mjs')) {
  main()
} else {
}
