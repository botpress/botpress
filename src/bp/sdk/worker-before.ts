import { EventEmitter } from 'events'
import path from 'path'
import { workerData } from 'worker_threads'

import { Distro } from '../common/getos'

process.BOTPRESS_EVENTS = new EventEmitter()
process.BOTPRESS_EVENTS.setMaxListeners(1000)
global.BOTPRESS_CORE_EVENT = (event, args) => process.BOTPRESS_EVENTS.emit(event, args)

if (workerData?.processData) {
  Object.assign(process, workerData.processData)
}

if (workerData?.processEnv) {
  Object.assign(process.env, workerData.processEnv)
  process.core_env = process.env as BotpressEnvironmentVariables
}

if (!process.core_env) {
  if (!!process.env.pkg) {
    process.pkg = process.env.pkg
  }

  process.LOADED_MODULES = {}
  process.PROJECT_LOCATION =
    process.pkg || process.env.pkg
      ? path.dirname(process.execPath) // We point at the binary path
      : __dirname // e.g. /dist/..

  process.core_env = process.env as BotpressEnvironmentVariables
}

if (!process.BOTPRESS_EVENTS) {
  process.BOTPRESS_EVENTS = new EventEmitter()
}

const os = require('os').platform()

const distribution =
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
        dist: 'Ubuntu',
        release: '18.04'
      }
process.distro = new Distro(distribution) // TODO: find the actual distribution with getos
