// to setup
// brew install poppler
//  or
// yum install poppler; yum install poppler-utils

import fs from 'fs'
import fetch from 'node-fetch'
import child_process from 'child_process'

const exports = {}

exports.normalizeText = function(s) {
	s = s.replace(/⻘/g, '青')
	s = s.replace(/⻑/g, '長')
	return s
}

exports.pdf2text = async function(fn) {
	return new Promise((resolve, reject) => {
		const cmd = 'pdftotext -layout -raw -nopgbrk ' + fn + ' -'
		child_process.exec(cmd, function(error, stdout, stderr) {
			if (error) {
				reject(error)
			} else {
				resolve(exports.normalizeText(stdout))
			}
		})
	})
}

exports.fetchPDFtoTXT = async function(url) {
	const pdf = await (await fetch(url)).arrayBuffer()
	const t = new Date().getTime()
	const fn = 'temp/' + t
	try {
		fs.mkdirSync('temp')
	} catch (e) {
	}
	fs.writeFileSync(fn, new Buffer.from(pdf), 'binary')
	const res = await pdf2text(fn)
	fs.unlinkSync(fn)
	return res
}

const main = async function() {
	const fn = '../data/kyotouacjp/01_contents_list_syo_san_ja_20200409.pdf'
	const data = await exports.pdf2text(fn)
	console.log(data)
}
if (process.argv[1].endsWith('/pdf2text.mjs')) {
  main()
}

export default exports
