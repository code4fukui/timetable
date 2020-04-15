import cheerio from 'cheerio'
import util from './util.js'
//import util from './util.mjs'
import fs from 'fs'
import fetch from 'node-fetch'

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
const parseTablesFromHTML = function(dom) {
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
const make = async function() {
  const path = './'
  const fnindex = 'fukuicedjp.csv'

  const list = []
  /*
  try {
    list = util.csv2json(util.decodeCSV(fs.readFileSync(path + fnndex, 'utf-8')))
  } catch (e) {
  }
  */

  //const html = fs.readFileSync(path + fn, 'utf-8')

  const tbl = []

  for (let i = 1; i <= 9; i++) {
    const url = `http://www.fukui-c.ed.jp/~fec/kyouzai/review_0${i}.htm`
    const html = await util.fetchText(url, null, true)
    const dom = cheerio.load(html)
    const tbls = parseTablesFromHTML(dom)
    console.log(tbls.length)
    for (const t of tbls) {
      for (const d of t) {
        let cnt = 0
        for (const d2 of d) {
          cnt += d2.length
        }
        if (cnt > 0)
          tbl.push(d)
      }
    }
    await util.sleep(1000)
  }
  writeCSVbyJSON(path + fnindex, tbl)
}
const writeCSVbyJSON = function(fn, json) {
  fs.writeFileSync(fn, util.addBOM(util.encodeCSV(util.json2csv(json))))
}
const main = async function() {
  const path = './'
  const fnindex = 'fukuicedjp2.csv'
  const fnindexdst = 'fukuicedjp3.csv'
  const list = util.csv2json(util.decodeCSV(util.removeBOM(fs.readFileSync(path + fnindex, 'utf-8'))))
  //console.log(list)
  // 正規化
  for (const d of list) {
    let target = d['学年']
    target = target.replace(/\s/g, '')
    target = target.replace(/校/g, '')
    target = target.replace(/生/g, '')
    target = util.toHalf(target)
    if (target == '中学全学年') {
      target = '中学1年/中学2年/中学3年'
    } else if (target == '小学全学年') {
      target = '小学1年/小学2年/小学3年/小学4年/小学5年/小学6年'
    } else if (target == '小学3年〜6年' || target == '小学中学年高学年') {
      target = '小学3年/小学4年/小学5年/小学6年'
    } else if (target == '小学5・6年' || target == '小学高学年') {
      target = '小学5年/小学6年'
    } else if (target == '小学1・2年' || target == '小学低学年') {
      target = '小学1年/小学2年'
    }
    d['学年'] = target

    const title = d['番組名 動画名']
    delete d['番組名 動画名']
    d['タイトル'] = title.length == 0 ? d['サイト名'] : title
  }
  // 並び替え
  list.sort(function(a, b) {
    if (a['学年'] < b['学年']) {
      return -1
    } else if (a['学年'] > b['学年']) {
      return 1
    } else if (a['番組名 動画名'] < b['番組名 動画名']) {
      return -1
    } else if (a['番組名 動画名'] > b['番組名 動画名']) {
      return 1
    }
    return 0
  })
  console.log(list)
  //writeCSVbyJSON(path + fnindexdst, list)
  writeCSVbyJSON('../data/fukuicedjp.csv', list)
}
if (process.argv[1].endsWith('/fukuicedjp.mjs')) {
  main()
} else {
}
