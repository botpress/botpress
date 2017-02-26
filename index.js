require("babel-polyfill")

var path = require('path')

module.exports = {
  Botpress: require(path.join(__dirname, 'lib/botpress.js')),
  DatabaseHelpers: require(path.join(__dirname, 'lib/database_helpers.js'))
}
