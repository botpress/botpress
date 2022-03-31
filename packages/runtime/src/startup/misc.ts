import 'reflect-metadata'
import { EventEmitter2 } from 'eventemitter2'
import path from 'path'
import yn from 'yn'
import getos from '../common/getos'
import { Debug } from '../debug'

export const setupErrorHandlers = () => {
  const printPlainError = err => {
    console.error('Error starting botpress')
    console.error(err)

    if (err instanceof Error) {
      console.error(err.message)
      console.error('---STACK---')
      console.error(err.stack)
    }
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

  process.stderr.write = stripDeprecationWrite

  process.on('unhandledRejection', err => {
    global.printErrorDefault(err)
  })

  process.on('uncaughtException', err => {
    global.printErrorDefault(err)
    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })
}

export const setupProcessVars = () => {
  process.BOTPRESS_EVENTS = new EventEmitter2()
  process.BOTPRESS_EVENTS.setMaxListeners(1000)
  global.BOTPRESS_CORE_EVENT = (event, args) => {
    process.BOTPRESS_EVENTS.emit(event, args)
  }

  process.LOADED_MODULES = {}
  process.PROJECT_LOCATION = process.pkg
    ? path.dirname(process.execPath) // We point at the binary path
    : path.join(__dirname, '..') // e.g. /dist/..
}

export const loadEnvVars = () => {
  require('dotenv').config({ path: path.resolve(process.PROJECT_LOCATION, '.env') })
  process.runtime_env = process.env as RuntimeEnvironmentVariables

  process.DISABLE_GLOBAL_SANDBOX = yn(process.runtime_env.DISABLE_GLOBAL_SANDBOX)
  process.DISABLE_BOT_SANDBOX = yn(process.runtime_env.DISABLE_BOT_SANDBOX)
  process.DISABLE_TRANSITION_SANDBOX = yn(process.runtime_env.DISABLE_TRANSITION_SANDBOX)
  process.DISABLE_CONTENT_SANDBOX = yn(process.runtime_env.DISABLE_CONTENT_SANDBOX)
  process.IS_LICENSED = true
  process.ASSERT_LICENSED = () => {}
  process.BPFS_STORAGE = process.runtime_env.BPFS_STORAGE || 'disk'
  process.CLUSTER_ENABLED = yn(process.runtime_env.CLUSTER_ENABLED)
  process.OAUTH_ENDPOINT = process.runtime_env.OAUTH_ENDPOINT
  process.NLU_ENDPOINT = process.runtime_env.NLU_ENDPOINT
  process.MESSAGING_ENDPOINT = process.runtime_env.MESSAGING_ENDPOINT
  process.MESSAGING_SESSION_COOKIE_NAME = process.runtime_env.MESSAGING_SESSION_COOKIE_NAME
  process.SDK_RATE_LIMIT = process.runtime_env.SDK_RATE_LIMIT
}

export const setupProcess = async () => {
  setupErrorHandlers()
  setupProcessVars()
  loadEnvVars()

  process.distro = await getos()
  process.VERBOSITY_LEVEL = 2
}
