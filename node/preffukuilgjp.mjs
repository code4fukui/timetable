import cheerio from 'cheerio'
import util from './util.mjs'
import fs from 'fs'
import fetch from 'node-fetch'

const URL = 'https://www.pref.fukui.lg.jp/doc/kyousei/learning_video.html'

const parseTags = function(dom, tag, key) {
  const res = []
  dom(tag).each((idx, ele) => {
    const text = dom(ele).text()
    if (!key || text.indexOf(key) >= 0)
      res.push(text)
  })
  return res
}
const parseTables = function(dom) {
  const tbl = []
  const extract = function(ele) {
    return dom(ele).text().trim()
  }
  const tbls = []
  dom('table', null, null).each((idx, div) => {
    const lines = []
    dom('tr', null, div).each((idx, dl) => {
      const line = []
      dom('th', null, dl).each((idx, ele) => line.push(extract(ele)))
      dom('td', null, dl).each((idx, ele) => line.push(extract(ele)))
      lines.push(line)
    })
    tbls.push(lines)
  })
  return tbls
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
  const path = '../data/preffukuilgjp/'

  const dt = util.formatYMD()
  const fnindex = dt + '.csv'

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
  const h4s = parseTags(dom, 'h4')
  console.log(h4s)
  const tbls = parseTables(dom)
  console.log(tbls)
  const tbl = []
  let cnt = 0
  for (const t of tbls) {
    const h4 = h4s[cnt++]
    for (const d of t) {
      d.push(h4)
      let d0 = d[0]
      const n = d0.indexOf('New!')
      if (n >= 0) {
        d0 = d0.substring(0, n).trim()
        d.push(dt)
        d[0] = d0
        tbl.push(d)
      } else {
        d.push('')
      }
    }
  }
  //fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(util.json2csv(tbl))))
  fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(tbl)))

  /*
  if (tbls.length > 0 ) {
    const tbl = tbls[0]
    tbl[0][0] = '市町'
    fs.writeFileSync(path + fncsv, util.addBOM(util.encodeCSV(tbl)))
  }
  */
}
if (process.argv[1].endsWith('/preffukuilgjp.mjs')) {
  main()
} else {
}
