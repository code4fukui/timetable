import util from './util.js'
import fs from 'fs'
import pdf2text from './pdf2text.mjs'

const splitString = function(s, splitters) {
  const res = []
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i)
    if (splitters.indexOf(c) >= 0) {
      if (i > n)
        res.push(s.substring(n, i))
      n = i + 1
    }
  }
  if (n < s.length)
    res.push(s.substring(n))
  return res
}
const main = async function() {
  const srcurl = 'https://www.kyokyo-u.ac.jp/movie/post.html'
  const path = '../data/kyotouacjp/'

  const dt = util.formatYMD()
  //const fnindex = dt + '.csv'
  const fnindex = 'index.csv'

  const list = []
  const flist = fs.readdirSync(path)
  for (const f of flist) {
    if (!f.endsWith('.pdf'))
      continue
    const fn = path + f
    const data = (await pdf2text.pdf2text(fn)).split('\n')
    console.log(data)
    for (let d of data) {
      if (d.startsWith('家庭科')) {
        d = '中 家庭科 ' + d.substring(3)
      }
      if (d.startsWith('小学校算数科')) {
        d = '小 算数科 ' + d.substring(6)
      }
      if (d.startsWith('中学校数学科')) {
        d = '中 数学科 ' + d.substring(6)
      }
      d = d.replace('小３', '小3')

      const n = d.indexOf('https://')
      if (n < 0)
        continue
      const url = d.substring(n)
      d = d.substring(0, n)
      const a1 = splitString(d, ' 　＿（）()')
      const item = {}
      item.url = url
      const title = []
      for (let i = 0; i < a1.length; i++) {
        let n = null
        let a = a1[i]
        if (a == '中') {
          a = '中学生'
          n = 'target'
        } else if (a == '小') {
          a = '小学生'
          n = 'target'
        } else if (a.match(/小\d/)) {
          a = '小学' + a.charAt(1) + '年'
          n = 'target'
        } else if (a.match(/中\d/)) {
          a = '中学' + a.charAt(1) + '年'
          n = 'target'
        } else if (a.match(/高\d/)) {
          a = '高校' + a.charAt(1) + '年'
          n = 'target'
        }
        
        if (a.endsWith('誤訳')) {
          a = a.replace('訳', '版')
        }
        if (a.endsWith('語版')) {
          n = 'lang'
        }
        if (a.endsWith('科')) {
          if (a != '理科')
            a = a.substring(0, a.length - 1)
          n = 'type'
        } else {
          const m = a.indexOf('科')
          if (m >= 0) {
            let type = a.substring(0, m)
            if (type == '理')
              type = '理科'
            item.type = type
            a = a.substring(m + 1)
          }
        }

        if (n) {
          item[n] = a
        } else {
          title.push(a)
        }
      }
      item.title = title.join(" ")
      list.push(item)
    }
  }
  console.log(list)
  fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(util.json2csv(list))), 'utf-8')
}
if (process.argv[1].endsWith('/kyotouacjp.mjs')) {
  main()
} else {
}
