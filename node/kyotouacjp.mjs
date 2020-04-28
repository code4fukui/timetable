import util from './util.mjs'
import fs from 'fs'
import pdf2text from './pdf2text.mjs'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

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

const fetchYouTubeVideoDuration = async function(data) {
  const lists = arrayChunk(data, 50)

  console.log('fetchYouTubeVideoDuration start')
  for (let i = 0; i < lists.length; i++) {
    const list = lists[i]
    const videoIds = list
      .map(d => d.URL)
      .map(url => {
        const result = url.match(/.*youtube.com\/watch\?v=([0-9a-zA-Z\-_]+).*/)
        if (result && result.length > 1) {
          return result[1]
        }
      })
    const json = await fetchYouTubeVideo(videoIds.join(','))
    if (json) {
      for (const item of json.items) {
        const target = list.find(d => d.URL.indexOf(item.id) >= 0)
        const duration = parseDuration(item.contentDetails.duration)
        target['長さ'] = duration
      }
    } else {
      console.log('youtube fetch error')
    }
    console.log('fetchYouTubeVideoDuration ' + (i + 1) + '/' + (lists.length) + ' done')
  }
}

const arrayChunk = ([...array], size = 1) => {
  return array.reduce((acc, value, index) => index % size ? acc : [...acc, array.slice(index, index + size)], [])
}

const fetchYouTubeVideo = async function(videoid) {
  const part = 'contentDetails'
  const url = `https://www.googleapis.com/youtube/v3/videos?part=${part}&id=${videoid}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
  const json = await (await fetch(url)).json()
  return json
}

const parseDuration = function(duration) {
  const fix0 = util.fix0
  let num = duration.match(/PT(\d+)S/) // PT27S
  if (num) {
    return '00:00:' + fix0(num[1], 2)
  }
  num = duration.match(/PT(\d+)M(\d+)S/) // PT12M27S
  if (num) {
    return '00:' + fix0(num[1], 2) + ':' + fix0(num[2], 2)
  }
  num = duration.match(/PT(\d+)H(\d+)M(\d+)S/) // PT1H12M27S
  if (num) {
    return fix0(num[1], 2) + ':' + fix0(num[2], 2) + ':' + fix0(num[3], 2)
  }
  num = duration.match(/PT(\d+)H(\d+)M/) // PT1H12M
  if (num) {
    return fix0(num[1], 2) + ':' + fix0(num[2], 2) + ':00'
  }
  num = duration.match(/PT(\d+)H(\d+)S/) // PT1H27S
  if (num) {
    return fix0(num[1], 2) + ':00:' + fix0(num[2], 2)
  }
  num = duration.match(/PT(\d+)H/) // PT15H
  if (num) {
    return fix0(num[1], 2) + '00:00'
  }
  num = duration.match(/PT(\d+)M/) // PT15M
  if (num) {
    return '00:' + fix0(num[1], 2) + ':00'
  }
  console.log('parse err', duration)
  return null
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
    let type = null
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

      if (d.indexOf('校') >= 0 && d.indexOf('動画コンテンツ') >= 0) {
        type = d.substring(d.indexOf('校') + 1, d.indexOf('動画コンテンツ'))
      }

      const n = d.indexOf('https://')
      if (n < 0)
        continue
      const url = d.substring(n)
      d = d.substring(0, n)
      const a1 = splitString(d, ' 　＿（）()')
      const item = {}
      item.URL = url
      const title = []
      for (let i = 0; i < a1.length; i++) {
        let n = null
        let a = a1[i]
        if (a == '中') {
          a = '中学生'
          n = '対象'
        } else if (a == '小') {
          a = '小学生'
          n = '対象'
        } else if (a.match(/小\d/)) {
          a = '小学' + a.charAt(1) + '年'
          n = '対象'
        } else if (a.match(/中\d/)) {
          a = '中学' + a.charAt(1) + '年'
          n = '対象'
        } else if (a.match(/高\d/)) {
          a = '高校' + a.charAt(1) + '年'
          n = '対象'
        }
        
        if (a.endsWith('誤訳')) {
          a = a.replace('訳', '版')
        }
        if (a.endsWith('語版')) {
          n = '言語'
        }

        if (a.endsWith('科')) {
          if (a != '理科')
            a = a.substring(0, a.length - 1)
          n = '科目'
        } else {
          const m = a.indexOf('科')
          if (m >= 0) {
            let t = a.substring(0, m)
            if (t == '理')
              t = '理科'
            item['科目'] = t
            a = a.substring(m + 1)
          }
        }
        if (n) {
          item[n] = a
        } else {
          title.push(a)
        }
      }
      item['タイトル'] = title.join(" ")
      if (!item['科目']) {
        item['科目'] = type
      }
      list.push(item)
    }
  }

  await fetchYouTubeVideoDuration(list)

  fs.writeFileSync(path + fnindex, util.addBOM(util.encodeCSV(util.json2csv(list))), 'utf-8')
}
if (process.argv[1].endsWith('/kyotouacjp.mjs')) {
  main()
} else {
}
