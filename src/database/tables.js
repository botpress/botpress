import { table_factories } from '+/database'

module.exports = [require('./users.js'), require('./tags.js'), require('./notifications.js')].concat(table_factories)
