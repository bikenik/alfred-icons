/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */
/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const crypto = require('crypto')
const alfy = require('alfy')
const got = require('got')
const oAuth = require('oauth-1.0a')
const api = require('./api')
const WorkflowError = require('./config/error')
const Render = require('./config/engine')

const {key, secret, rows} = process.env
const page = process.argv[3] ? process.argv[3] : '1'
const searchMode = process.argv[4] ? process.argv[4] : 'regular'
const {collectionId} = process.env

let endPoint
if (searchMode === 'regular') {
	endPoint = `http://api.thenounproject.com/icons/${alfy.input}?limit=${rows}&page=${page}`
}
if (searchMode === 'collection') {
	endPoint = `http://api.thenounproject.com/collection/${collectionId.toString()}/icons?limit=${rows}&page=${page}`
}

const oauth = oAuth({
	consumer: {
		key, secret
	},
	signature_method: 'HMAC-SHA1',
	hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
})

const token = {
	key: process.env.ACCESS_TOKEN,
	secret: process.env.ACCESS_TOKEN_SECRET
}

const url = endPoint

got(url, {
	headers: oauth.toHeader(oauth.authorize({url, method: 'GET'}, token)),
	json: true
}).then(data => {
	api(data.body, page)
}).catch(error => {
	if (/<p>You don't have the permission to access the requested resource./.test(error.body)) {
		const item = new Render('Autorization',
			'title', 'subtitle', 'arg')
		item.title = `You need 'key' and 'secret' to get acces`
		item.subtitle = `Hit ↵ to go 'noun project' documentation and get theire`
		item.arg = 'https://api.thenounproject.com/getting_started.html#creating-an-api-key'
		alfy.output([item.getProperties()])
	} else if (/<p>The requested URL was not found/.test(error.body)) {
		const item = new Render('initial typing',
			'title', 'subtitle')
		item.title = 'Type something to search your awesome icon'
		item.subtitle = 'use ↑↓ buttons to navigate through the pages to choose next or previous page'
		alfy.output([item.getProperties()])
	} else if (/<p>No icons/.test(error.body)) {
		const previous = parseInt(page, 10) - 1
		const item = new Render('the end of icons list',
			'title', 'subtitle', 'arg', 'variables')
		item.title = `THE END: hit ↵ to go the previous page ${previous}`
		item.subtitle = 'click ↑ to choose next page'
		item.arg = previous.toString()
		item.variables = {
			currentSearch: alfy.input,
			action: 'flipping',
			page: previous
		}
		alfy.output([item.getProperties()])
	} else {
		throw new WorkflowError(error.stack)
	}
})
