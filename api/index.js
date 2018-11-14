/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */
/* eslint-env es6 */
'use strict'
const fs = require('fs')
const alfy = require('alfy')
const request = require('request-promise')
const streamToPromise = require('stream-to-promise')

const Render = require('../config/engine')
const WorkflowError = require('../config/error')

const rmDir = function (dirPath) {
	let files
	try {
		files = fs.readdirSync(dirPath)
	} catch (error) {
		return error
	}

	if (files.length > 0) {
		files.forEach(file => {
			const filePath = dirPath + '/' + file
			if (fs.statSync(filePath) && fs.statSync(filePath).isFile()) {
				fs.unlinkSync(filePath)
			} else {
				rmDir(filePath)
			}
		})
	}
	if (!fs.existsSync(dirPath)) {
		fs.rmdirSync(dirPath)
	}
}
const dir = './tmp'
rmDir(dir)
if (alfy.input === 'snth') {
	throw new WorkflowError('Variable does not exist', {
		autocomplete: '!set '
	})
}

module.exports = (data, page) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir)
	}
	data.icons.forEach(async x => {
		const iconFile = x.preview_url_84.replace(/.*\/(\d.*)/, `$1`)
		const writeStreamIcon = fs.createWriteStream(
			`${dir}/${iconFile}`
		)
		await request.get(x.preview_url_84).pipe(writeStreamIcon)
		await streamToPromise(writeStreamIcon)
		writeStreamIcon.end()
	})

	const items = []
	if (page > 1) {
		const previous = parseInt(page, 10) - 1
		items.push({
			title: `Hit ↵ to go the previous page ${previous}`,
			subtitle: 'click ↑ to choose next page',
			arg: previous.toString(),
			variables: {
				currentSearch: alfy.input,
				action: 'flipping',
				page: previous
			}
		})
	}
	items.push(...data.icons.map(x => {
		const tags = `\t\t${x.tags.map(x => x.slug).join(', ')}`
		const item = new Render('List of Search',
			'title', 'arg', 'subtitle', 'icon', 'quicklookurl', 'variables', 'mods')
		item.title = x.uploader.name
		item.subtitle = x.collections && x.collections.length > 0 ? '🧰 ' + x.collections.map(y => `${y.name} / ${y.date_created.replace(/(^.*?)\s.*/g, `$1`)}`)[0] + tags : process.env.searchMode === 'collection' ? data.collection.name + tags : 'no collection' + tags
		item.arg = `https://thenounproject.com${x.permalink}`
		item.icon = `./tmp/${x.preview_url_84.replace(/.*\/(\d.*)/, `$1`)}`
		item.quicklookurl = x.attribution_preview_url
		item.variables = {
			action: 'regular'
		}
		item.mods = {
			cmd: {
				subtitle: 'Choose collection by tag',
				arg: JSON.stringify(x.tags),
				variables: {
					searchMode: 'tags'
				}
			}
		}
		if (x.collections && x.collections.length > 0) {
			item.mods = {
				alt: {
					subtitle: 'Go to this collection',
					variables: {
						searchMode: 'collection',
						collectionId: x.collections.map(y => y.id)[0].toString(),
						page: '1'
					}
				}
			}
		}
		return item.getProperties()
	}))
	const next = parseInt(page, 10) + 1
	items.push({
		title: `Hit ↵ to go the next page ${next}`,
		subtitle: page > 1 ? 'click ↓ to choose previous page' : 'click next to show more icons',
		arg: next.toString(),
		variables: {
			currentSearch: alfy.input,
			action: 'flipping',
			page: next.toString()
		}
	})
	try {
		alfy.output(items)
	} catch (error) {
		const messages = []
		alfy.output([{
			title: `Error: ${error.message}`,
			subtitle: messages.join(' | '),
			autocomplete: error.autocomplete ? error.autocomplete : '',
			icon: {
				path: alfy.icon.error
			},
			valid: false,
			text: {
				largetype: error.stack,
				copy: error.stack
			}
		}])
	}
}
