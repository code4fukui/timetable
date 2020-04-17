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
  const baseurl = 'https://ocwx.ocw.u-tokyo.ac.jp/course-search/' // ?start=0
  //https://ocwx.ocw.u-tokyo.ac.jp/course-search/?start=5

  const path = '../data/utokyoacjp/'
  
  const dt = util.formatYMD()
  const fnindex = dt + '.csv'

  const list = []

  for (let i = 0;; i += 5) {
    let html = null
    try {
      html = fs.readFileSync(path + i + '.html', 'utf-8')
    } catch (e) {
      const url = baseurl + "?start=" + i
      console.log(url)
      html = await (await fetch(url)).text()
      fs.writeFileSync(path + i + '.html', html, 'utf-8')
    }
    //console.log(html)
    const dom = cheerio.load(html)

    let cnt = 0
    dom('.pj-lecture').each((idx, ele) => {
      const a = dom(dom('a', null, ele)[0])
      const o = {}
      o.url = a.attr('href')
      const ss = a.text().trim().split('\n')
      if (ss.length == 1) {
        o.no = ss[0].trim()
      } else {
        const s2 = ss[1].trim()
        let no = ss[0].trim()
        no = no.startsWith('#') ? parseInt(no.substring(1)) : no
        const n1 = s2.indexOf('　')
        if (n1 < 0) {
          o.no = no
          o.title = s2
        } else {
          const type = s2.substring(0, n1)
          const n2 = type.indexOf('-')
          if (n2 > 0)
            o.type = type.substring(0, n2)
          else
            o.type = type
          o.no = no
          o.title = s2.substring(n1 + 1)
        }
      }
      o.author = dom(dom('.pj-lecture-lecturer', null, ele)[0]).text().trim().replace(/　/g, ' ')
      list.push(o)
      console.log(o)
      cnt++
    })
    console.log(cnt)
    if (!cnt)
      break
  }
  console.log(list)
  fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(util.json2csv(list))), 'utf-8')
  return

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
  //fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(tbl)))

  /*
  if (tbls.length > 0 ) {
    const tbl = tbls[0]
    tbl[0][0] = '市町'
    fs.writeFileSync(path + fncsv, util.addBOM(util.encodeCSV(tbl)))
  }
  */
}
if (process.argv[1].endsWith('/utokyoacjp.mjs')) {
  main()
} else {
}
