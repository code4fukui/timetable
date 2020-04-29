import util from './util.mjs'
import fs from 'fs'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

const fetchYouTubePlaylist = async function(playlistid, pageToken) {
  const part = 'snippet'
  //const part = 'contentDetails'
  //const part = 'status'
  const spagetoken = pageToken ? "&pageToken=" + pageToken : ""
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=${part}&playlistId=${playlistid}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}` + spagetoken
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
const fetchYouTubeVideoDuration = async function(videoid) {
  if (Array.isArray(videoid)) {
    const json = await fetchYouTubeVideo(videoid.join(','))
    if (!json)
      return null
    console.log(json)
    const res = []
    for (const d of json.items) {
      res.push(parseDuration(d.contentDetails.duration))
    }
    return res
  } else {
    const json = await fetchYouTubeVideo(videoid)
    if (!json)
      return null
    console.log(json)
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
  } else if (a.match(/高校\d年/)) {
    return '高校' + a.charAt(2) + '年'
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

const filterKojima = function(stitle) {
  const ss = util.splitString(stitle, ' 　「」')
  let target = '小学生'
  let type = ''
  if (ss[0].startsWith('小')) {
    target = '小学' + util.toHalf(ss[0]).charAt(1) + "年"
    if (ss[0].length == 2) {
      type = ss[1]
      stitle = ss[2]
    } else {
      type = ss[0].substring(2)
      stitle = ss[1]
    }
  }
  return {
    '対象': target,
    '科目': normalizeType(type),
    'タイトル': stitle,
  }
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
const filterJA = function(stitle) {
  const n = stitle.indexOf('chapter')
  let no = ""
  if (n >= 0) {
    no = stitle.substring(n + 'chapter'.length)
    stitle = stitle.substring(0, n)
  }
  return {
    '対象': '',
    '科目': '体育',
    'No': no,
    'タイトル': stitle,
  }
}
const filterPCNMiyazaki = function(stitle) {
  const n = stitle.indexOf(' ')
  let no = ''
  if (n >= 0) {
    no = parseInt(stitle)
    stitle = stitle.substring(n + 1)
  }
  return {
    '対象': '小中学生',
    '言語': '英語版',
    '科目': 'プログラミング',
    'No': no,
    'タイトル': stitle,
  }
}
const filterColumbiaMusic = function(stitle) {
  if (stitle.indexOf('NHK DVD教材') >= 0)
    return null
  let type = ''
  if (stitle.indexOf('道徳') >= 0)
    type = '道徳'
  if (stitle.indexOf('英語') >= 0)
    type = '英語'
  if (stitle.indexOf('外国語') >= 0)
    type = '外国語'
  return {
    '科目': type,
    'タイトル': stitle,
  }
}


const makeCSV = async function(type, listid, name, filter) {
  const path = '../data/' + name + "/"
  let data = null
  let pid = listid
  if (type == 'playlist') {
    data = await fetchYouTubePlaylist(listid)
  } else if (type == 'channel') {
    data = await fetchYouTubeChannel(listid)
    pid = data.items[0].contentDetails.relatedPlaylists.uploads // UU_ZMXFvvu-YWEbk0wK79jhw
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
  let nlist = 0
  for (;;) {
    const videoids = []
    for (const d of data.items) {
      const s = d.snippet
      if (!s.thumbnails) // private video
        continue
      console.log(s)
      const o = filter ? filter(s.title) : { 'タイトル': s.title }
      if (!o)
        continue
      const videoid = s.resourceId.videoId
      o['公開日'] = s.publishedAt
      o.URL = 'https://www.youtube.com/watch?v=' + videoid
      list.push(o)
      videoids.push(videoid)
    }
    const duration = await fetchYouTubeVideoDuration(videoids)
    console.log(duration.length, videoids.length, nlist)
    for (let i = 0; i < duration.length; i++) {
      const v = list[nlist + i]
      if (v) {
        v['長さ'] = duration[i]
      } else {
        console.log("?? " + (nlist + i) + " is null")
      }
    }
    nlist += list.length
    if (!data.nextPageToken)
      break
    data = await fetchYouTubePlaylist(pid, data.nextPageToken)
  }

  const dt = util.formatYMD()
  //const fnindex = 'index.csv'
  console.log(list)
  const scsv = util.addBOM(util.encodeCSV(util.json2csv(list)))
  util.mkdirSyncForFile(path)

  const bkdata = null
  try {
    bkdata = fs.readFileSync(path + 'index.csv')
  } catch (e) {
  }
  if (bkdata != scsv) {
    fs.writeFileSync(path + dt + '.csv', scsv, 'utf-8')
    fs.writeFileSync(path + 'index.csv', scsv, 'utf-8')
  }
  console.log(data)
}

const list = 
  `https://www.youtube.com/watch?v=DYfwKLbmYzo
  https://www.youtube.com/watch?v=EaJwC4nE4aM
  https://www.youtube.com/watch?v=kTyZ0B4Z6w0
  https://www.youtube.com/watch?v=BbH7_X5WoT4
  https://www.youtube.com/watch?v=ZlXwZpfM9Bs
  https://www.youtube.com/watch?v=g0mAEnV9pNU
  https://www.youtube.com/watch?v=nps0iJVyTZo
  https://www.youtube.com/watch?v=sC0FIsUMhyk
  https://www.youtube.com/watch?v=DQHDWG9qciY
  https://www.youtube.com/watch?v=I_OS0LCGNUw
  https://www.youtube.com/watch?v=qBVZRRrwx1A`

const main = async function() {
  
  //const videoid = 'H_aZRDq9Qxg'
  //const videoid = 'https://www.youtube.com/watch?v=_yncog6eojs&t=16s'
  //const videoid = 'dtauGqnQpig'
  
  //const videoid = 'DYfwKLbmYzo,EaJwC4nE4aM' // 'H_aZRDq9Qxg,dtauGqnQpig'
  //const videoid = [ 'H_aZRDq9Qxg', 'EaJwC4nE4aM' ] // ,dtauGqnQpig'
  //const videoid = 'H_aZRDq9Qxg' // ,dtauGqnQpig'
  /*
  const list2 = list.split('\n').map(s => s.substring(s.indexOf('=') + 1))
  //console.log(list2)
  //return
  const v = await fetchYouTubeVideoDuration(list2)
  console.log(v.join('\n')) // duration: 'PT12M27S',
  //console.log(await fetchYouTubeVideoDuration([ 'H_aZRDq9Qxg', 'dtauGqnQpig' ]))
  return
  */
 
  const contents = [
    { name: 'fukuipref', type: 'channel', id: 'UC_ZMXFvvu-YWEbk0wK79jhw', filter: filterFukui },
    //{ name: 'miraikyoiku', type: 'channel', id: 'UCPQzSBuLEfaMWDWUsqq8p4w' }, 

    // { name: 'saitamacity', type: 'playlist', id: 'PLhOpFff6DKIkPLwurIS8cnVUw6-_FkXXj', filter: filterSaitama },
    //{ name: 'kojimayoshio', type: 'playlist', id: 'PLLdkONQoKM9hc8inyYM3Gb-S9YeDVb8Dj', filter: filterKojima },
    //{ name: 'pcnmiyazaki', type: 'playlist', id: 'PLEELZXgkDttSIaLQNZxLwu9OirMD4hFOX', filter: filterPCNMiyazaki },
    //{ name: 'columbiamusic', type: 'playlist', id: 'PL8AHg6vdz1U3V_D8uM2ynhZqTmA93nmeP', filter: filterColumbiaMusic },
    // { name: 'masakowakamiya', type: 'playlist', id: 'PLMLiIqfcPDBrXbp8QgzwK0PTMsF9SFQzr' },
    
    // { name: 'jakyosai', type: 'channel', id: 'UCaoWo7xRE-ZBI5jWORv9_Jw', filter: filterJA },

  ]
  for (const c of contents) {
    await makeCSV(c.type, c.id, c.name, c.filter)
  }
}
if (process.argv[1].endsWith('/youtubeplaylist.mjs')) {
  main()
}
