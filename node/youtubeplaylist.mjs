import util from './util.mjs'
import fs from 'fs'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

const fetchYouTubePlaylist = async function(playlistid) {
  const part = 'snippet'
  //const part = 'contentDetails'
  //const part = 'status'
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=${part}&playlistId=${playlistid}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
  const json = await (await fetch(url)).json()
  return json
}
const fetchYouTubeChannel = async function(id) {
  //const part = 'snippet'
  const part = 'contentDetails'
  //const part = 'status'
  const url = `https://www.googleapis.com/youtube/v3/channels?part=${part}&id=${id}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
  const json = await (await fetch(url)).json()
  return json
}
const fetchYouTubeVideo = async function(videoid) {
  if (videoid.startsWith('https://')) {
    const ss = videoid.match(/https:\/\/www.youtube.com\/watch\?v=([^\&]+)/)
    if (!ss)
      return null
    videoid = ss[1]
  }
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
  console.log('parse err', duration)
  return null
}
const fetchYouTubeVideoDuration = async function(videoid) {
  if (Array.isArray(videoid)) {
    const json = await fetchYouTubeVideo(videoid.join(','))
    if (!json)
      return null
    const res = []
    for (const d of json.items) {
      res.push(parseDuration(d.contentDetails.duration))
    }
    return res
  } else {
    const json = await fetchYouTubeVideo(videoid)
    if (!json)
      return null
    const d = json.items[0].contentDetails
    return parseDuration(d.duration)
  }
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
  } else if (a.match(/小学校\d年/)) {
    return '小学' + a.charAt(3) + '年'
  } else if (a.match(/中学校\d年/)) {
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
  } else if (s == '外国語活動') {
    return '外国語'
  }
  return s
}

const filterSaitama = function(stitle) {
  let target, type, title
  if (stitle.startsWith('特別支援')) {
    const ss = util.splitString(stitle, ' 　「」')
    target = '特別支援'
    type = ''
    title = ss.slice(1).join(' ')
  } else {
    const ss = util.splitString(stitle, ' 　「」')
    target = ss[0]
    type = ss[1]
    title = ss.slice(2).join(' ')
  }
  return {
    '対象': normalizeTarget(target),
    '科目': normalizeType(type),
    'タイトル': title,
  }
}
const normalizeTitle = function(t) {
  const cnum = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿'
  for (let i = 0; i < cnum.length; i++) {
    t = t.replace(cnum.charAt(i), '(' + (i + 1) + ')')
  }
  return util.toHalf(t)
}
// 【ふくいわくわく授業】小学校1年国語①(えんぴつとなかよくなろう)
const filterFukui = function(stitle) {
  const s = stitle.substring('【ふくいわくわく授業】'.length)
  const ss = util.splitString(s, '年（）')
  const target = ss[0] + "年"
  let type = normalizeTitle(ss[1])
  let n = type.indexOf('(')
  let no = ""
  if (n >= 0) {
    const num = type.match(/(.+)\((\d+)\)/)
    type = num[1]
    no = num[2]
  }
  const title = normalizeTitle(ss[2])
  return {
    '対象': normalizeTarget(target),
    '科目': normalizeType(type),
    'No': no,
    'タイトル': title,
  }
}

const makeCSV = async function(type, listid, name, filter) {
  const path = '../data/' + name + "/"
  let data = null
  if (type == 'playlist') {
    data = await fetchYouTubePlaylist(listid)
  } else if (type == 'channel') {
    data = await fetchYouTubeChannel(listid)
    const pid = data.items[0].contentDetails.relatedPlaylists.uploads // UU_ZMXFvvu-YWEbk0wK79jhw
    data = await fetchYouTubePlaylist(pid)
    /*
    console.log(data)
    console.log(data.items[0].contentDetails)
    return
    */
  } else {
    console.log('ignore type')
    return null
  }

  const list = []
  const videoids = []
  for (const d of data.items) {
    const s = d.snippet
    if (!s.thumbnails) // private video
      continue
    console.log(s)
    const o = filter(s.title)
    const videoid = s.resourceId.videoId
    o['公開日'] = s.publishedAt
    o.URL = 'https://www.youtube.com/watch?v=' + videoid
    list.push(o)
    videoids.push(videoid)
  }
  const duration = await fetchYouTubeVideoDuration(videoids)
  for (let i = 0; i < list.length; i++) {
    list[i]['長さ'] = duration[i]
  }
  const dt = util.formatYMD()
  //const fnindex = 'index.csv'
  console.log(list)
  const scsv = util.addBOM(util.encodeCSV(util.json2csv(list)))
  fs.writeFileSync(path + dt + '.csv', scsv, 'utf-8')
  fs.writeFileSync(path + 'index.csv', scsv, 'utf-8')
}

const main = async function() {
  
  //const videoid = 'H_aZRDq9Qxg'
  //const videoid = 'https://www.youtube.com/watch?v=_yncog6eojs&t=16s'
  //const videoid = 'dtauGqnQpig'
  /*
  const videoid = 'H_aZRDq9Qxg,dtauGqnQpig'
  const v = await fetchYouTubeVideoDuration(videoid)
  console.log(v) // duration: 'PT12M27S',
  console.log(await fetchYouTubeVideoDuration([ 'H_aZRDq9Qxg', 'dtauGqnQpig' ]))
  return
  */
  const contents = [
    { name: 'fukuipref', type: 'channel', id: 'UC_ZMXFvvu-YWEbk0wK79jhw', filter: filterFukui },
    //{ name: 'saitamacity', type: 'playlist', id: 'PLhOpFff6DKIkPLwurIS8cnVUw6-_FkXXj', filter: filterSaitama },
  ]
  for (const c of contents) {
    await makeCSV(c.type, c.id, c.name, c.filter)
  }
}
if (process.argv[1].endsWith('/youtubeplaylist.mjs')) {
  main()
}
