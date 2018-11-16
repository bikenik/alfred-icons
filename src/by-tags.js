'use strict'
const alfy = require('alfy')

const tags = JSON.parse(process.env.tags)

const items = alfy.matches('', tags, 'slug')
	.map(x => ({
		title: x.slug,
		variables: {
			collection: JSON.stringify(x),
			searchMode: 'by slug'
		}
	}))
alfy.output(items)
