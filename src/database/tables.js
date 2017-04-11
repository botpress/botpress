import { table_factories } from '+/database'

module.exports = [
  require('./users.js')
].concat(table_factories)
