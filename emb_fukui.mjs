/* fukuno.js CC BY @taisuke */

import util from './util.mjs'

const TYPE = 'timetable'

const inject = async function(src) {
	const data = await util.fetchCSVtoJSON(src)
	console.log(data)
	data.sort(function(a, b) {
		if (a['科目'] > b['科目'])
			return -1
		if (a['科目'] < b['科目'])
			return 1
		return parseInt(a.No) - parseInt(b.No)
		/*
		if (a['公開日'] < b['公開日'])
			return -1
		if (a['公開日'] > b['公開日'])
			return 1
		return 0
		*/
	})
	/*
	<h4>小学１年</h4>
	<p>&nbsp;</p>
	<table style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: " cellspacing="1" cellpadding="1">
			<tbody>
					<tr>
							<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: ">国語（１）</td>
							<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: ">えんぴつとなかよくなろう</td>
							<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: "><a target="_blank" href="https://youtu.be/H_aZRDq9Qxg">https://youtu.be/H_aZRDq9Qxg</a></td>
					</tr>
					<tr>
							<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: ">算数（１）&nbsp;</td>
							<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: ">さんすうをはじめよう</td>
							<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: "><a target="_blank" href="https://youtu.be/VPLHk-Ydg9g">https://youtu.be/VPLHk-Ydg9g</a></td>
					</tr>
			</tbody>
	</table>
	*/
	let latestdt = 0
	for (const d of data) {
		const dt = new Date(d['公開日']).getTime()
		if (dt > latestdt)
			latestdt = dt
	}
	latestdt = util.formatYMD(new Date(latestdt))
	let s = ''
	const targets = [ '小学1年', '小学2年', '小学3年', '小学4年', '小学5年', '小学6年', '中学1年', '中学2年', '中学3年', '高校1年', '高校2年', '高校3年' ]
	for (const target of targets) {
		const list = []
		for (const d of data) {
			if (d['対象'] == target)
				list.push(d)
		}
		if (list.length > 0) {
			s += `	<p>&nbsp;</p>
			<h4>${target}</h4>
			<p>&nbsp;</p>
			<table style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: " cellspacing="1" cellpadding="1">
					<tbody>
`
			for (const d of list) {
				const newcap = d['公開日'] == latestdt ? '　<font style="color: #ff0000"><u><i>New!</i></u></font>' : ""
				const nocap = d['No'] != null ? ' (' + d['No'] + ')' : ""
				s += `					<tr>
				<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: ">${d['科目'] + nocap + newcap /*国語（１）*/}</td>
				<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: ">${d['タイトル'] /*えんぴつとなかよくなろう*/}</td>
				<td style="border-top-color: ; border-left-color: ; border-bottom-color: ; border-right-color: "><a target="_blank" href="${d.URL}">${d.URL}</a></td>
		</tr>
`
			}
			s += `    </tbody>
			</table>
`
		}
	}
	const ele = document.createElement('div')
	ele.innerHTML = s
	return ele
}

const main = async function() {
	const c = document.querySelector(`script[data-type="${TYPE}"]`)
	const src = c.getAttribute('data-src')
	const ele = await inject(src)
	c.parentElement.insertBefore(ele, c.nextSibling)
}
main()
