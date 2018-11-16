/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */
/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const crypto = require('crypto')
const alfy = require('alfy')
const got = require('got')
const oAuth = require('oauth-1.0a')
const api = require('./src/api')
const WorkflowError = require('./src/config/error')
const Render = require('./src/config/engine')

const {key, secret, rows} = process.env
const page = process.argv[3] ? process.argv[3] : '1'
let searchMode = process.argv[4] ? process.argv[4] : 'regular'
let {collection} = process.env

let collectionObj
const collectionSearchBol = (process.env.collection && searchMode === 'by id') || searchMode === 'by slug'
if (collectionSearchBol) {
	collectionObj = JSON.parse(collection)
	switch (searchMode) {
		case 'by id':
			collection = collectionObj.id
			searchMode = 'by id'
			break
		case 'by slug':
			collection = collectionObj.slug
			searchMode = 'by slug'
			break
		default:
			break
	}
}

let endPoint
if (searchMode === 'regular') {
	endPoint = `http://api.thenounproject.com/icons/${alfy.input.replace(/\s/, '-')}?limit=${rows}&page=${page}`
} else {
	endPoint = `http://api.thenounproject.com/collection/${collection}/icons?limit=${rows}&page=${page}`
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
	} else if (/<p>No icons found for term/.test(error.body) && page <= 1) {
		const item = new Render('not found this icon',
			'title', 'subtitle', 'autocomplete', 'valid')
		item.title = `No icons found for term "${alfy.input}"`
		item.subtitle = 'hit ↵ and try another query'
		item.autocomplete = ''
		item.valid = false
		alfy.output([item.getProperties()])
	} else if (/<p>The requested URL was not found/.test(error.body)) {
		const item = new Render('initial typing',
			'title', 'subtitle')
		item.title = 'Type something to search your awesome icon'
		item.subtitle = 'use ↑↓ buttons to navigate through the pages to choose next or previous page'
		alfy.output([item.getProperties()])
	} else if (/<p>No icons/.test(error.body) && page > 1) {
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
	} else if (/<p>No icons found for collection/.test(error.body) && page <= 1) {
		let subtitleArg
		if (searchMode === 'by slug') {
			subtitleArg = 'by ID'
		} else {
			subtitleArg = 'by slug'
		}
		const item = new Render('not found by tag',
			'title', 'subtitle', 'autocomplete', 'valid', 'variables', 'icon')
		item.title = `No icons found for collection by tag "${collectionObj.slug}" using '${searchMode === 'by id' ? 'ID' : 'Slug'}'`
		item.subtitle = `hit ↵ and try search ${subtitleArg}`
		item.autocomplete = ''
		item.valid = true
		item.icon = './icons/refresh.png'
		item.variables = {
			action: 'flipping',
			searchMode: searchMode === 'by id' ? 'by slug' : 'by id'
		}
		alfy.output([item.getProperties()])
	} else {
		throw new WorkflowError(error.stack)
	}
})
