import { table_factories } from '+/database'

module.exports = [
  require('./users.js'),
  require('./tags.js'),
  require('./notifications.js'),
  require('./sessions.js'),
  require('./ghost.js')
].concat(table_factories)
