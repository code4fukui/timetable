import util from './util.mjs'
import fs from 'fs'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

const fetchYouTubePlaylist = async function (playlistid, pageToken) {
  const part = 'snippet'
  // const part = 'contentDetails'
  // const part = 'status'
  const spagetoken = pageToken ? '&pageToken=' + pageToken : ''
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=${part}&playlistId=${playlistid}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}` + spagetoken
  const json = await (await fetch(url)).json()
  // fs.writeFileSync(`temp/playlistItems-${playlistid}-${part}-${pageToken}.json`, JSON.stringify(json))
  return json
}
const fetchYouTubePlaylists = async function (id, pageToken) {
  const part = 'snippet'
  const spagetoken = pageToken ? '&pageToken=' + pageToken : ''
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=${part}&channelId=${id}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}` + spagetoken
  const json = await (await fetch(url)).json()
  return json
}
const fetchYouTubeChannel = async function (id) {
  // const part = 'snippet'
  const part = 'contentDetails'
  // const part = 'status'
  const url = `https://www.googleapis.com/youtube/v3/channels?part=${part}&id=${id}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
  const json = await (await fetch(url)).json()
  return json
}
const fetchYouTubeVideo = async function (videoid, part) {
  if (videoid.startsWith('https://')) {
    const ss = videoid.match(/https:\/\/www.youtube.com\/watch\?v=([^&]+)/)
    if (!ss) {
      return null
    }
    videoid = ss[1]
  }
  part = part || 'contentDetails'
  const url = `https://www.googleapis.com/youtube/v3/videos?part=${part}&id=${videoid}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
  const json = await (await fetch(url)).json()
  // fs.writeFileSync(`temp/video-${util.getYMDHMS()}.json`, JSON.stringify(json))
  return json
}
const parseDuration = function (duration) {
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
const fetchYouTubeVideoDuration = async function (videoid) {
  if (Array.isArray(videoid)) {
    const json = await fetchYouTubeVideo(videoid.join(','))
    if (!json) {
      return null
    }
    // console.log(json)
    const res = []
    for (const d of json.items) {
      res.push(parseDuration(d.contentDetails.duration))
    }
    return res
  } else {
    const json = await fetchYouTubeVideo(videoid)
    if (!json) {
      return null
    }
    // console.log(json)
    const d = json.items[0].contentDetails
    return parseDuration(d.duration)
  }
}

const normalizeTarget = function (a) {
  a = util.toHalf(a)
  if (a === '小学校低学年') {
    return '小学1年/小学2年/小学3年'
  } else if (a === '小学校高学年') {
    return '小学4年/小学5年/小学6年'
  } else if (a === '小・中学校共通') {
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
const normalizeType = function (s) {
  if (s === 'G・S' || s === 'G・S') {
    return '英語'
  } else if (s === '体育・保健体育') {
    return '体育'
  } else if (s === '図画工作') {
    return '図工'
  } else if (s === '外国語活動') {
    return '外国語'
  } else if (s.endsWith('数学')) {
    return '数学'
  } else if (s.endsWith('算数')) {
    return '算数'
  } else if (s.endsWith('理科')) {
    return '理科'
  } else if (s.endsWith('英語')) {
    return '英語'
  }
  let n = s.match(/[小|中|高]\s?(.+)$/)
  if (n) {
    return n[1]
  }
  return s
}

const filterKojima = function (stitle) {
  const ss = util.splitString(stitle, ' 　「」')
  let target = '小学生'
  let type = ''
  if (ss[0].startsWith('小')) {
    target = '小学' + util.toHalf(ss[0]).charAt(1) + "年"
    if (ss[0].length === 2) {
      type = ss[1]
      stitle = ss[2]
    } else {
      type = ss[0].substring(2)
      stitle = ss[1]
    }
  }
  return {
    対象: target,
    科目: normalizeType(type),
    タイトル: stitle
  }
}
const filterSaitama = function (stitle) {
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
    対象: normalizeTarget(target),
    科目: normalizeType(type),
    タイトル: title
  }
}
const normalizeTitle = function (t) {
  const cnum = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿'
  for (let i = 0; i < cnum.length; i++) {
    t = t.replace(cnum.charAt(i), '(' + (i + 1) + ')')
  }
  t = util.toHalf(t)
  t = t.replace(/\s+/g, ' ')
  t = t.replace(/\s・\s/g, '・')
  t = t.replace(/テ-ション/g, 'テーション')
  return t.trim()
}
// 【ふくいわくわく授業】小学校1年国語①(えんぴつとなかよくなろう)
const filterFukui = function (stitle) {
  const s = stitle.substring('【ふくいわくわく授業】'.length)
  const ss = util.splitString(s, '年（）')
  const target = ss[0] + '年'
  let type = normalizeTitle(ss[1])
  const n = type.indexOf('(')
  let no = ''
  if (n >= 0) {
    const num = type.match(/(.+)\((\d+)\)/)
    type = num[1]
    no = num[2]
  }
  const title = normalizeTitle(ss[2])
  return {
    対象: normalizeTarget(target),
    科目: normalizeType(type),
    No: no,
    タイトル: title
  }
}
const filterJA = function (stitle) {
  const n = stitle.indexOf('chapter')
  let no = ''
  if (n >= 0) {
    no = stitle.substring(n + 'chapter'.length)
    stitle = stitle.substring(0, n)
  }
  return {
    対象: '',
    科目: '体育',
    No: no,
    タイトル: stitle
  }
}
const filterPCNMiyazaki = function (stitle) {
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
const filterColumbiaMusic = function (stitle) {
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

const fetchVideoDataFromPlaylist = async function (pid, filter, skipduration) {
  let data = await fetchYouTubePlaylist(pid)
  console.log(data, 'fetchYouTubePlaylist')
  const list = []
  let nlist = 0
  for (;;) {
    const videoids = []
    for (const d of data.items) {
      const s = d.snippet
      if (!s.thumbnails) { // private video
        continue
      }
      // console.log(s)
      const o = filter ? filter(s.title) : { タイトル: s.title }
      if (!o) {
        continue
      }
      const videoid = s.resourceId.videoId
      o['公開日'] = s.publishedAt
      o.URL = 'https://www.youtube.com/watch?v=' + videoid
      list.push(o)
      videoids.push(videoid)
    }
    if (!skipduration) {
      const duration = await fetchYouTubeVideoDuration(videoids)
      console.log(duration.length, videoids.length, nlist)
      for (let i = 0; i < duration.length; i++) {
        const v = list[nlist + i]
        v['長さ'] = duration[i]
      }
    }
    nlist += videoids.length
    if (!data.nextPageToken) {
      break
    }
    data = await fetchYouTubePlaylist(pid, data.nextPageToken)
  }
  return list
}
const saveCSV = function (path, list) {
  const dt = util.formatYMD()
  // const fnindex = 'index.csv'
  console.log(list)
  const scsv = util.addBOM(util.encodeCSV(util.json2csv(list)))
  util.mkdirSyncForFile(path)

  let bkdata = null
  try {
    bkdata = fs.readFileSync(path + 'index.csv')
  } catch (e) {
  }
  if (bkdata !== scsv) {
    fs.writeFileSync(path + dt + '.csv', scsv, 'utf-8')
    fs.writeFileSync(path + 'index.csv', scsv, 'utf-8')
  }
}
const makeCSV = async function (type, listid, name, filter) {
  const path = '../data/' + name + '/'
  if (type === 'playlist') {
    const list = await fetchVideoDataFromPlaylist(listid)
    saveCSV(path, list)
  } else if (type === 'channel') {
    const data = await fetchYouTubeChannel(listid)
    const pid = data.items[0].contentDetails.relatedPlaylists.uploads
    const list = await fetchVideoDataFromPlaylist(pid)
    saveCSV(path, list)
  } else if (type === 'allplaylists') {
    let data = await fetchYouTubePlaylists(listid)
    const lists = []
    console.log(data)
    for (;;) {
      for (const d of data.items) {
        const pid = d.id
        // console.log(d.snippet)
        const ptitle = d.snippet.title
        const skipduration = false
        const list = await fetchVideoDataFromPlaylist(pid, null, skipduration)
        list.forEach(i => {
          i.ptitle = ptitle
          i.playlistId = pid
        })
        lists.push(list)
      }

      saveCSV(path, lists.flat())

      if (!data.nextPageToken) { break }
      data = await fetchYouTubePlaylists(listid, data.nextPageToken)
    }
    //saveCSV(path, lists.flat())
  } else {
    console.log('ignore type')
    return null
  }
}

const list = `https://www.youtube.com/watch?v=Q7ok9YayiA0
  https://www.youtube.com/watch?v=tEMJhIVZYT0
  https://www.youtube.com/watch?v=CEOgvDD1Fnk
  https://www.youtube.com/watch?v=US5KCPV-eBQ
  https://www.youtube.com/watch?v=VPLHk-Ydg9g
  https://www.youtube.com/watch?v=RiSyTzHTts0
  https://www.youtube.com/watch?v=jez2hwMau1M
  https://www.youtube.com/watch?v=u8jaIYOiMBU
  https://www.youtube.com/watch?v=DYfwKLbmYzo
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

// とある男が授業をしてみた
const filterToaruotoko = function (stitle, ptitle) {
  let n = util.toHalf(stitle).match(/【(.+)】\s*([小|中])(\d)[-|－](\d+)\s+(.+)$/) // 【算数】小4-1 大きい数のしくみ①
  if (n) {
    const res = {
      科目: normalizeType(n[1]),
      対象: n[2] + '学' + n[3] + '年',
      No: n[4],
      タイトル: normalizeTitle(n[5])
    }
    // console.log(res)
    return res
  }
  n = util.toHalf(ptitle).match(/テスト対策 中(\d).+【(.+)】/) // テスト対策 中1-6章【空間図形】
  if (n) {
    const m = stitle.indexOf('】')
    if (m >= 0) {
      stitle = stitle.substring(m + 1)
    }
    const n2 = util.toHalf(stitle).match(/(\d+)$/)
    let no = ''
    if (n2) {
      no = n2[1]
    }
    const res = {
      科目: '数学',
      対象: '中学' + n[1] + '年',
      No: no,
      タイトル: normalizeTitle(stitle + n[2])
    }
    // console.log(res)
    return res
  }
  if (ptitle === 'きっかけ英単語(中学)' || ptitle === 'きっかけ英熟語(中学)' || ptitle === '英語並び替え') {
    const n2 = util.toHalf(stitle).match(/【(.+)-(\d+)/)
    let no = ''
    if (n2) {
      no = n2[2]
    }
    const res = {
      科目: '英語',
      対象: '中学生',
      No: no,
      タイトル: normalizeTitle(stitle) // n2[1] + (n2[2] ? ' ' + n2[2] : '')
    }
    // console.log(res)
    return res
  }
  if (ptitle === '国語－古文') {
    const no = util.toHalf(stitle).match(/【.+-(\d+)/)[1]
    const res = {
      科目: '国語',
      対象: '中学生',
      No: no,
      タイトル: normalizeTitle(stitle) // n2[1] + (n2[2] ? ' ' + n2[2] : '')
    }
    // console.log(res)
    return res
  }
  if (ptitle.startsWith('高校(数')) {
    let n = util.toHalf(stitle).match(/【\D+(\d+)】(.+)$/)
    // console.log(stitle)
    let no = ''
    let title = ''
    if (n) {
      no = n[1]
      title = n[2]
    } else {
      no = util.toHalf(stitle).match(/-(\d+)/)[1]
      title = util.toHalf(stitle).match(/】(.+)$/)[1]
    }
    const res = {
      科目: '数学',
      対象: '高校生',
      No: no,
      タイトル: normalizeTitle(title)
    }
    // console.log(res)
    return res
  }
  for (let t of ['数学', '理科', '歴史']) {
    if (ptitle.startsWith('高校受験対策-' + t) || ptitle.startsWith('高校受験対策 ' + t) || ptitle.startsWith('受験対策－' + t)) {
      const n = stitle.indexOf('】')
      let title = stitle.substring(n + 1)
      if (title.length === 0) {
        title = stitle.substring(stitle.lastIndexOf('/') + 1, n)
      }
      title = normalizeTitle(title)
      if (title.startsWith(t + '-')) {
        title = title.substring(3)
      }
      if (title.length < 6) {
        title = '高校受験対策 ' + title
      }
      const res = {
        科目: t,
        対象: '中学3年',
        タイトル: title
      }
      // console.log(res)
      return res
    }
  }
  if (ptitle === '【歴史/さくっ答シリーズ】' || ptitle === '時差に悩んでいる方はこちら') {
    const res = {
      科目: '社会',
      対象: '中学生',
      タイトル: normalizeTitle(stitle.charAt(0) === '【' ? stitle : stitle.substring(0, stitle.indexOf('【')))
    }
    // console.log(res)
    return res
  }
  if (ptitle === '【時事問題】') {
    const res = {
      科目: '社会',
      対象: '中学生',
      タイトル: normalizeTitle(stitle)
    }
    // console.log(res)
    return res
  }
  if (ptitle === '【料理】') {
    const res = {
      科目: '家庭',
      対象: '中学生',
      タイトル: normalizeTitle(stitle)
    }
    // console.log(res)
    return res
  }
  if (ptitle === '読書') {
    const res = {
      科目: '国語',
      対象: '小中学生',
      タイトル: normalizeTitle(stitle)
    }
    // console.log(res)
    return res
  }
  n = util.toHalf(stitle).match(/^【(.+)】(.+)$/)
  if (n) {
    const sub = n[1]
    if (sub === '高校数学') {
      const res = {
        科目: '数学',
        対象: '高校生',
        タイトル: normalizeTitle(n[2])
      }
      //console.log(res)
      return res
    } else if (sub === '高校受験対策/数学') {
      const res = {
        科目: '数学',
        対象: '中学3年',
        タイトル: normalizeTitle(n[2])
      }
      //console.log(res)
      return res
    } else if (sub === '国語') {
      const res = {
        科目: '国語',
        対象: '中学生',
        タイトル: normalizeTitle(n[2])
      }
      // console.log(res)
      return res
    } else if (sub === '社会') {
      const res = {
        科目: '社会',
        対象: '中学生',
        タイトル: normalizeTitle(n[2])
      }
      // console.log(res)
      return res
    } else if (sub === '英語') {
      const res = {
        科目: '英語',
        対象: '中学' + n[2].charAt(1) + '年',
        タイトル: normalizeTitle(n[2].substring(3))
      }
      // console.log(res)
      return res
    } else if (sub === 'イントロダクション') {
      const res = {
        科目: '数学',
        対象: '中学' + n[2].charAt(1) + '年',
        タイトル: normalizeTitle(n[2].substring(5))
      }
      // console.log(res)
      return res
    }
  }
  console.log(stitle, '*', ptitle)
  return null
  /*
  const s = stitle.substring('【ふくいわくわく授業】'.length)
  const ss = util.splitString(s, '年（）')
  const target = ss[0] + '年'
  let type = normalizeTitle(ss[1])
  const n = type.indexOf('(')
  let no = ''
  if (n >= 0) {
    const num = type.match(/(.+)\((\d+)\)/)
    type = num[1]
    no = num[2]
  }
  const title = normalizeTitle(ss[2])
  return {
    対象: normalizeTarget(target),
    科目: normalizeType(type),
    No: no,
    タイトル: title
  }
  */
}

// 予備校のノリで学ぶ「大学の数学・物理
const filterYobinori = function (stitle, ptitle) {
  const getTarget = function () {
    return stitle.indexOf('1分解説') >= 0 ? '高校生' : (ptitle.indexOf('高校') >= 0 ? '高校生' : '大人')
  }
  const getTitle = function () {
    if (['1分解説'].find(s => stitle.indexOf(s) >= 0)) { return stitle }
    let n = stitle.match(/^【(.+)】(.+)$/)
    // console.log(n)
    if (!n) { return stitle }
    const title2 = n[2]
    if (['難易度'].find(s => title2.indexOf(s) >= 0)) { return title2 }
    n = title2.match(/^(.+)【.+】$/)
    if (!n) { return title2 }
    return n[1].trim()
  }
  const ignoreptitle = ['コラボ動画', 'ライブ配信', '番外編', 'ヨビノリ他チャンネル出演']
  if (ignoreptitle.includes(ptitle)) { return null }
  const maths = ['数学', '微分', '積分', '確率', '計算', 'ベクトル', '解析学', '線形代数', '単位の接頭辞', '非線形']
  if (maths.find(s => ptitle.indexOf(s) >= 0) || maths.find(s => stitle.indexOf(s) >= 0)) {
    return {
      科目: '数学',
      対象: getTarget(),
      タイトル: getTitle()
    }
  }
  const physics = ['物理', '宇宙', '力学', '光の速さ', '物性実験', '電子']
  if (physics.find(s => ptitle.indexOf(s) >= 0) || physics.find(s => stitle.indexOf(s) >= 0)) {
    return {
      科目: '物理',
      対象: getTarget(),
      タイトル: getTitle()
    }
  }
  const chemistry = ['化学']
  if (chemistry.find(s => ptitle.indexOf(s) >= 0) || chemistry.find(s => stitle.indexOf(s) >= 0)) {
    return {
      科目: '化学',
      対象: getTarget(),
      タイトル: getTitle()
    }
  }
  const biochemistry = ['生物']
  if (biochemistry.find(s => ptitle.indexOf(s) >= 0) || biochemistry.find(s => stitle.indexOf(s) >= 0)) {
    return {
      科目: '生物',
      対象: getTarget(),
      タイトル: getTitle()
    }
  }
  console.log(stitle, ptitle)
  return null
}

const normalizeList = function (dst, src, filter) {
  const list = util.readJSONfromCSV(src)
  const res = []
  for (const i of list) {
    const data = filter(i.タイトル, i.ptitle)
    if (!data) { continue }
    for (const n in data) {
      i[n] = data[n]
    }
    i.プレイリストタイトル = i.ptitle
    delete i.ptitle
    delete i.playlistId
    res.push(i)
  }
  console.log(res.length)
  util.writeCSV(dst, util.json2csv(res))
}

const main = async function () {
  /*
  const list = util.readJSONfromCSV('../data/toaruotoko/index.csv')
  const videos = []
  const chs = []
  const chlist = []
  for (const i of list) {
    if (videos.indexOf(i.URL) === -1) {
      videos.push(i.URL)
    }
    if (chs.indexOf(i.playlistId) === -1) {
      chs.push(i.playlistId)
      chlist.push(i)
    }
  }
  console.log(videos.length)
  //util.writeCSV('../data/toaruotoko/playlist', util.json2csv(chlist))
  return
  */
  //console.log(filterToaruotoko('【中１　理科】　　中１－４３　　日常生活のなかの力'))
  //return


  /*
  const plist = util.readJSONfromCSV('../data/19chtv/playlist.csv')
  const list = util.readJSONfromCSV('../data/19chtv/index.csv')
  const res = []
  for (const i of list) {
    if (plist.find(p => p.playlistId === i.playlistId).有効 === '0') { continue }
    const data = filterToaruotoko(i.タイトル, i.ptitle)
    if (data) {
      for (const n in data) {
        i[n] = data[n]
      }
      i.プレイリストタイトル = i.ptitle
      delete i.ptitle
      delete i.playlistId
      res.push(i)
    }
  }
  console.log(res.length)
  util.writeCSV('../data/19chtv/19chtv', util.json2csv(res))
  return
  */
  normalizeList('../data/yobinorimanabu/yobinori', '../data/yobinorimanabu/index.csv', filterYobinori)
  return

  /*
  // get channelId by video
  const videoid = 'qIBYA96WPVQ'
  const data = await fetchYouTubeVideo(videoid, 'snippet')
  console.log(data.items[0].snippet) // -> channelId UCzDd3Byvt91oyf3ggRlTb3A
  return
  */

  /*
  //const videoid = 'H_aZRDq9Qxg'
  //const videoid = 'https://www.youtube.com/watch?v=_yncog6eojs&t=16s'
  //const videoid = 'dtauGqnQpig'

  //const videoid = 'DYfwKLbmYzo,EaJwC4nE4aM' // 'H_aZRDq9Qxg,dtauGqnQpig'
  //const videoid = [ 'H_aZRDq9Qxg', 'EaJwC4nE4aM' ] // ,dtauGqnQpig'
  //const videoid = 'H_aZRDq9Qxg' // ,dtauGqnQpig'

  const list2 = list.split('\n').map(s => s.substring(s.indexOf('=') + 1))
  //console.log(list2)
  //return
  const v = await fetchYouTubeVideoDuration(list2)
  console.log(v.join('\n')) // duration: 'PT12M27S',
  //console.log(await fetchYouTubeVideoDuration([ 'H_aZRDq9Qxg', 'dtauGqnQpig' ]))
  return
  */

  const contents = [
    // { name: 'fukuipref', type: 'channel', id: 'UC_ZMXFvvu-YWEbk0wK79jhw', filter: filterFukui }
    // { name: 'miraikyoiku', type: 'channel', id: 'UCPQzSBuLEfaMWDWUsqq8p4w' },

    // { name: 'saitamacity', type: 'playlist', id: 'PLhOpFff6DKIkPLwurIS8cnVUw6-_FkXXj', filter: filterSaitama },
    // { name: 'kojimayoshio', type: 'playlist', id: 'PLLdkONQoKM9hc8inyYM3Gb-S9YeDVb8Dj', filter: filterKojima },
    // { name: 'pcnmiyazaki', type: 'playlist', id: 'PLEELZXgkDttSIaLQNZxLwu9OirMD4hFOX', filter: filterPCNMiyazaki },
    // { name: 'columbiamusic', type: 'playlist', id: 'PL8AHg6vdz1U3V_D8uM2ynhZqTmA93nmeP', filter: filterColumbiaMusic },
    // { name: 'masakowakamiya', type: 'playlist', id: 'PLMLiIqfcPDBrXbp8QgzwK0PTMsF9SFQzr' },

    // { name: 'jakyosai', type: 'channel', id: 'UCaoWo7xRE-ZBI5jWORv9_Jw', filter: filterJA },
    // { name: 'toaruotoko', type: 'allplaylists', id: 'UCzDd3Byvt91oyf3ggRlTb3A' } // 
    { name: 'yobinorimanabu', type: 'allplaylists', id: 'UCqmWJJolqAgjIdLqK3zD1QQ', filter: filterYobinori } // https://www.youtube.com/channel/UCqmWJJolqAgjIdLqK3zD1QQ/playlists // 予備校のノリで学ぶ「大学の数学・物理」
    // { name: 'nakatayoutubeuniv', type: 'allplaylists', id: 'UCFo4kqllbcQ4nV83WCyraiw', filter: filterToaruotoko } // https://www.youtube.com/channel/UCFo4kqllbcQ4nV83WCyraiw/playlists

  ]
  for (const c of contents) {
    await makeCSV(c.type, c.id, c.name, c.filter)
  }
}
if (process.argv[1].endsWith('/youtubeplaylist.mjs')) {
  main()
}
