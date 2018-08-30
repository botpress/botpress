'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
const _ = require('lodash')

exports.default = data => data.items.map(item => JSON.parse(item.payload))
