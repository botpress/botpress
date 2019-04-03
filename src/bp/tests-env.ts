import { EventEmitter } from 'events'

const { Debug: _Debug } = require('./debug.ts')

global.DEBUG = _Debug

if (!process.core_env) {
  process.core_env = process.env
}

if (!process.BOTPRESS_EVENTS) {
  process.BOTPRESS_EVENTS = new EventEmitter()
}

process.distro = {
  os: require('os').platform(),
  codename: '',
  dist: '',
  release: ''
}
