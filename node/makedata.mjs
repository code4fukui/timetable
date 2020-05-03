import util from './util.mjs'

const makeData = async function () {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdsFYLU6roC8Y-PB-7MSJxxVByBh-fQxpa-Bcf0Hatykrv8M20ZQ0NAwFF5MBjw7qTZ2NnKRNEBNeP/pub?gid=0&single=true&output=csv'
  const path = '../data/'
  const baseurl = 'https://code4fukui.github.io/timetable/data/'

  const fn = 'funs'

  const list = await util.fetchCSVtoJSON(url)
  util.writeCSV(path + 'index', util.json2csv(list))

  const data = []
  for (const item of list) {
    console.log(item.URL)
    const gdoc = item.URL.startsWith('https://docs.google.com/') && item.URL.endsWith('=csv')
    if (item.URL.endsWith('.csv') || gdoc) {
      const items = await util.fetchCSVtoJSON(item.URL)
      if (gdoc) {
        const fn = 'spreadsheet/data' + item['教材ID']
        util.writeCSV(path + fn, util.json2csv(items))
        item.URL = baseurl + fn + '.csv'
      }
      // const d = util.setJSON({}, item)
      let cnt = 0
      for (const a of items) {
        if (a['有効'] && parseInt(a['有効']) === 0) {
          continue
        }
        const d2 = util.copyJSON(item)
        util.setJSON(d2, a)
        delete d2['備考']
        delete d2['有効']
        if (!d2['タイトル']) { d2['タイトル'] = d2['教材シリーズ名'] }
        data.push(d2)
        if (cnt++ < 3) { console.log(d2) }
      }
    } else {
      delete item['備考']
      data.push(item)
      console.log(data)
    }
  }
  console.log(data.length)
  util.writeCSV(path + fn, util.json2csv(data))
}
const main = async function () {
  await makeData()
}
if (process.argv[1].endsWith('/makedata.mjs')) {
  main()
}
