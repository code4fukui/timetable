import util from './util.mjs'

const main = async function() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdsFYLU6roC8Y-PB-7MSJxxVByBh-fQxpa-Bcf0Hatykrv8M20ZQ0NAwFF5MBjw7qTZ2NnKRNEBNeP/pub?gid=0&single=true&output=csv'
  const path = '../data/'
  const baseurl = 'https://code4fukui.github.io/timetable/data/'

  const fn = 'funs'

  const list = await util.fetchCSVtoJSON(url)
  const data = []
  for (const item of list) {
    const items = await util.fetchCSVtoJSON(item.URL)
    if (item.URL.startsWith('https://docs.google.com/')) {
      const fn = 'spreadsheet/' + item['教材ID']
      util.writeCSV(path + fn, util.json2csv(items))
      item.URL = baseurl + fn + '.csv'
    }
    const d = util.setJSON({}, item)
    for (const a of items) {
      const d2 = util.copyJSON(d)
      util.setJSON(d2, a)
      delete d2['備考']
      data.push(d2)
    }
  }
  console.log(data)
  util.writeCSV(path + 'index', util.json2csv(list))
  util.writeCSV(path + fn, util.json2csv(data))
}
if (process.argv[1].endsWith('/makedata.mjs')) {
  main()
}
