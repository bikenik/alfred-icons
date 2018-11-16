
const largetypeFunc = (title, subtitle) => {
	if (title && subtitle) {
		return `${title}\n${subtitle}`
	}
}

module.exports = class Render {
	constructor(name, ...itemKeys) {
		const item = {}
		const defaultItems = {
			name,
			autocomplete: '',
			valid: true
		}

		for (const key in defaultItems) {
			if (Object.prototype.hasOwnProperty.call(defaultItems, key)) {
				item[key] = defaultItems[key]
			}
		}

		for (const key of itemKeys) {
			this.itemKey = null
			Object.defineProperty(this, key, {
				get: () => key,
				set: value => {
					item[key] = value
					if (key === 'title') {
						item.autocomplete = item.title
					}
					if (key === 'icon') {
						item.icon = {path: item.icon}
					}
					/* -----------------------------
					following rules must be runing after all iterations
					------------------------------- */
					if (Object.keys(item).length - Object.keys(defaultItems).length === itemKeys.length) {
						if (!item.text) {
							const largetype = largetypeFunc(item.title, item.subtitle)
							item.text = {
								copy: largetype,
								largetype
							}
						}
					}
				}
			})
		}
		this.getProperties = () => item
	}
}
