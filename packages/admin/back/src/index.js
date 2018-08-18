if (process.env.NODE_ENV === 'production') {
  require('dotenv').config()
} else {
  require('dotenv').config({ path: './.env.local' })
}

require('babel-core/register')
require('babel-polyfill')

module.exports = require('./start')
