if (!global._babelPolyfill) {
  require('babel-polyfill')
}

const DatabaseHelpers = require('./src/database/helpers.js')

const CLI = () => require('./src/cli')
const Botpress = () => require('./src/botpress.js')

module.exports = { Botpress, DatabaseHelpers, CLI }
