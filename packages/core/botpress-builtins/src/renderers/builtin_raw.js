'use strict'

export default data => data.items.map(item => JSON.parse(item.payload))
