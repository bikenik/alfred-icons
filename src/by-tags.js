'use strict'
const alfy = require('alfy')

const tags = JSON.parse(process.env.tags)

const items = alfy.matches('', tags, 'slug')
	.map(x => ({
		title: x.slug,
		variables: {
			collectionSlug: x.slug,
			searchMode: 'tags'
		}
	}))
alfy.output(items)
