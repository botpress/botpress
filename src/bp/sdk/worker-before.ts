import { EventEmitter } from 'events'
import path from 'path'
import { workerData } from 'worker_threads'

import { Distro } from '../common/getos'

process.BOTPRESS_EVENTS = new EventEmitter()
process.BOTPRESS_EVENTS.setMaxListeners(1000)
global.BOTPRESS_CORE_EVENT = (event, args) => process.BOTPRESS_EVENTS.emit(event, args)

const processData = workerData?.processData
if (processData) {
  Object.assign(process, processData)
  process.distro = new Distro(JSON.parse(processData.distro))
}

if (workerData?.processEnv) {
  Object.assign(process.env, workerData.processEnv)
  process.core_env = process.env as BotpressEnvironmentVariables
}

if (!process.core_env) {
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
