global['NativePromise'] = global.Promise

import { getAppDataPath } from 'core/misc/app_data'
import fs from 'fs'
import path from 'path'
import yn from 'yn'
import { Debug } from './debug'
import getos from './getos'

const printPlainError = err => {
  /* eslint-disable no-console */
  console.log('Error starting botpress')
  console.log(err)
  console.log(err.message)
  console.log('---STACK---')
  console.log(err.stack)
}

global.DEBUG = Debug
global.printErrorDefault = printPlainError

const originalWrite = process.stdout.write

const shouldDiscardError = message =>
  !![
    '[DEP0005]' // Buffer() deprecation warning
  ].find(e => message.indexOf(e) >= 0)

function stripDeprecationWrite(buffer: string, encoding: string, cb?: Function | undefined): boolean
function stripDeprecationWrite(buffer: string | Buffer, cb?: Function | undefined): boolean
function stripDeprecationWrite(this: Function): boolean {
  if (typeof arguments[0] === 'string' && shouldDiscardError(arguments[0])) {
    return (arguments[2] || arguments[1])()
  }

  return originalWrite.apply(this, (arguments as never) as [string])
}

if (process.env.APP_DATA_PATH) {
  process.APP_DATA_PATH = process.env.APP_DATA_PATH
} else {
  process.APP_DATA_PATH = getAppDataPath()
}

process.IS_FAILSAFE = yn(process.env.BP_FAILSAFE)
process.LOADED_MODULES = {}

process.PROJECT_LOCATION =
  process.env.PROJECT_LOCATION ||
  (process.pkg
    ? path.dirname(process.execPath) // We point at the binary path
    : path.resolve(__dirname, '../bp')) // e.g. /dist/..

process.stderr.write = stripDeprecationWrite

process.on('unhandledRejection', err => {
  console.trace(err)
  global.printErrorDefault(err)
  if (!process.IS_FAILSAFE) {
    process.exit(1)
  }
})

process.on('uncaughtException', err => {
  global.printErrorDefault(err)
  if (!process.IS_FAILSAFE) {
    process.exit(1)
  }
})

try {
  require('dotenv').config({ path: path.resolve(process.PROJECT_LOCATION, '.env') })
  process.core_env = process.env as BotpressEnvironmentVariables

  let defaultVerbosity = process.IS_PRODUCTION ? 0 : 2
  if (!isNaN(Number(process.env.VERBOSITY_LEVEL))) {
    defaultVerbosity = Number(process.env.VERBOSITY_LEVEL)
  }

  process.IS_PRO_AVAILABLE = fs.existsSync(path.resolve(process.PROJECT_LOCATION, 'pro')) || !!process.pkg
  process.BPFS_STORAGE = process.core_env.BPFS_STORAGE || 'disk'

  process.CLUSTER_ENABLED = yn(process.env.CLUSTER_ENABLED)
  process.IS_PRO_ENABLED = yn(process.env.PRO_ENABLED) || yn(process.env['BP_CONFIG_PRO.ENABLED'])

  const start = async () => {
    process.VERBOSITY_LEVEL = defaultVerbosity
    process.distro = await getos()

    require('./core/app/bootstrap')
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  start()
} catch (err) {
  global.printErrorDefault(err)
}
