import util from './util.mjs'
import fs from 'fs'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

const fetchYouTubePlaylist = async function(playlistid) {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistid}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
  const json = await (await fetch(url)).json()
  return json
}

const normalizeTarget = function(a) {
  a = util.toHalf(a)
  if (a == '小学校低学年') {
    return '小学1年/小学2年/小学3年'
  } else if (a == '小学校高学年') {
    return '小学4年/小学5年/小学6年'
  } else if (a == '小・中学校共通') {
    return '小中学生'
  } else if (a.match(/小\d/)) {
    return '小学' + a.charAt(1) + '年'
  } else if (a.match(/中\d/)) {
    return '中学' + a.charAt(1) + '年'
  } else if (a.match(/高\d/)) {
    return '高校' + a.charAt(1) + '年'
  } else if (a.match(/小学校\d年生/)) {
    return '小学' + a.charAt(3) + '年'
  } else if (a.match(/中学校\d年生/)) {
    return '中学' + a.charAt(3) + '年'
  } else if (a.match(/高校\d年生/)) {
    return '高校' + a.charAt(3) + '年'
  }
  console.log('other', a)
  return a
}
const normalizeType = function(s) {
  if (s == 'G・S' || s == 'G・S') {
    return '英語'
  } else if (s == '体育・保健体育') {
    return '体育'
  } else if (s == '図画工作') {
    return '図工'
  }
  return s
}

const main = async function() {
  const playlistid = 'PLhOpFff6DKIkPLwurIS8cnVUw6-_FkXXj'
  const data = await fetchYouTubePlaylist(playlistid)
  const path = '../data/saitamacity/'
  //console.log(data)
  const list = []
  for (const d of data.items) {
    const s = d.snippet
    if (!s.thumbnails) // private video
      continue
    console.log(s)
    let target, type, title
    if (s.title.startsWith('特別支援')) {
      const ss = util.splitString(s.title, ' 　「」')
      target = '特別支援'
      type = ''
      title = ss.slice(1).join(' ')
    } else {
      const ss = util.splitString(s.title, ' 　「」')
      target = ss[0]
      type = ss[1]
      title = ss.slice(2).join(' ')
    }
    list.push({
      '公開日': s.publishedAt,
      'URL': 'https://www.youtube.com/watch?v=' + s.resourceId.videoId,
      '対象': normalizeTarget(target),
      '科目': normalizeType(type),
      'タイトル': title,
    })
  }
  const dt = util.formatYMD()
  //const fnindex = 'index.csv'
  console.log(list)
  fs.writeFileSync(path + dt + '.csv', util.addBOM(util.encodeCSV(util.json2csv(list))), 'utf-8')
  fs.writeFileSync(path + 'index.csv', util.addBOM(util.encodeCSV(util.json2csv(list))), 'utf-8')
}
if (process.argv[1].endsWith('/youtubeplaylist.mjs')) {
  main()
}
