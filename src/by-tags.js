'use strict'
const alfy = require('alfy')

const tags = JSON.parse(process.env.tags)

const items = alfy.inputMatches(tags, 'slug')
	.map(x => ({
		title: x.slug,
		icon: {path: './icons/tags.png'},
		variables: {
			collection: JSON.stringify(x),
			searchMode: 'by slug'
		}
	}))
alfy.output(items)
