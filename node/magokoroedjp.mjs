import cheerio from 'cheerio'
import util from './util.js'
import fs from 'fs'
import fetch from 'node-fetch'

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
  const baseurl = 'http://www.magokoro.ed.jp/'
  const path = '../data/mogokoroedjp/'
  
  const dt = util.formatYMD()
  const fnindex = dt + '.csv'

  const list = []

  {
    let html = null
    const id = 1
    try {
      html = fs.readFileSync(path + id + '.html', 'utf-8')
    } catch (e) {
      const url = baseurl
      console.log(url)
      html = await (await fetch(url)).text()
      fs.writeFileSync(path + id + '.html', html, 'utf-8')
    }
    //console.log(html)
    const dom = cheerio.load(html)

    let cnt = 0
    dom('.table-1 td').each((idx, ele) => {
      const iframe = dom('iframe', null, ele)
      if (iframe.length > 0) {
        console.log(dom(iframe[0]).attr('src'))
      } else {
        const txt = dom(ele).text()
        if (txt)
          console.log(txt)
      }
    })
    console.log(cnt)
  }
  console.log(list)
  fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(util.json2csv(list))), 'utf-8')
}
if (process.argv[1].endsWith('/magokoroedjp.mjs')) {
  main()
} else {
}
