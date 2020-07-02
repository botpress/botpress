import { EventEmitter } from 'events'

const { Debug: _Debug } = require('./debug.ts')

global.DEBUG = _Debug

if (!process.core_env) {
  process.core_env = process.env as BotpressEnvironmentVariables
}

if (!process.BOTPRESS_EVENTS) {
  process.BOTPRESS_EVENTS = new EventEmitter()
}

const os = require('os').platform()
process.distro =
  os !== 'linux'
    ? {
        os,
        codename: '',
        dist: '',
        release: ''
      }
    : {
        os,
        codename: '',
        dist: 'Alpine Linux', // github checks runs on alpine...
        release: '3.11.6'
      }
