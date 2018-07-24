if (!global._babelPolyfill) {
  require('babel-polyfill')
}

const DatabaseHelpers = require('./database/helpers.js')

const CLI = () => require('./cli')
const Botpress = require('./botpress.js')

module.exports = { Botpress, DatabaseHelpers, CLI }
