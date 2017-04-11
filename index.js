require('babel-polyfill')

var path = require('path')

var DatabaseHelpers = require('./src/database/helpers.js')

var CLI = () => require('./src/cli')
var Botpress = () => require('./src/botpress.js')

module.exports = { Botpress, DatabaseHelpers, CLI }
