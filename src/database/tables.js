import { table_factories } from '+/database'

module.exports = [
  require('./users.js'),
  require('./tags.js')
].concat(table_factories)
