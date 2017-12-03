import { table_factories } from '+/database'

module.exports = [
  require('./users.js'),
  require('./tags.js'),
  require('./notifications.js'),
  require('./content.js'),
  require('./sessions.js')
].concat(table_factories)
