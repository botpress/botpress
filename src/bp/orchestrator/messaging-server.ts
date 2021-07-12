import * as sdk from 'botpress/sdk'
import { ChildProcess, fork, spawn } from 'child_process'
import _ from 'lodash'
import path from 'path'
import portFinder from 'portfinder'

import { MessageType, onProcessExit, registerProcess, registerMsgHandler } from './master'

export interface MessagingServerOptions {
  host: string
  port: number
}

export const DEFAULT_MESSAGING_OPTIONS: MessagingServerOptions = {
  host: 'localhost',
  port: 3100
}

export const getMessagingBinaryPath = () => {
  const basePath = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../')
  return path.resolve(basePath, `bin/messaging${process.distro.os === 'win32' ? '.exe' : ''}`)
}

let initialParams: Partial<MessagingServerOptions>

export const registerMessagingServerMainHandler = (logger: sdk.Logger) => {
  registerMsgHandler(MessageType.StartMessagingServer, async (message: Partial<MessagingServerOptions>) => {
    initialParams = message
    await startMessagingServer(message, logger)
  })
}

let messagingServerProcess: ChildProcess | undefined

export const killMessagingProcess = () => {
  messagingServerProcess?.kill('SIGKILL')
}

export const startMessagingServer = async (opts: Partial<MessagingServerOptions>, logger: sdk.Logger) => {
  const options = _.merge(DEFAULT_MESSAGING_OPTIONS, opts)
  const port = await portFinder.getPortPromise({ port: options.port })

  registerProcess('messaging', port)

  const env = {
    NODE_ENV: process.env.NODE_ENV,
    NODE_OPTIONS: '',
    PORT: port.toString(),
    BOTPRESS_EXTERNAL_URL: process.core_env.EXTERNAL_URL,
    INTERNAL_PASSWORD: process.INTERNAL_PASSWORD,
    ENCRYPTION_KEY: '', // we disable encryption for now,
    DATABASE_URL: process.core_env.DATABASE_URL || `${process.PROJECT_LOCATION}/data/storage/core.sqlite`,
    DATABASE_POOL: process.env.DATABASE_POOL,
    CLUSTER_ENABLED: process.core_env.CLUSTER_ENABLED?.toString(),
    REDIS_URL: process.core_env.REDIS_URL,
    REDIS_SCOPE: process.core_env.BP_REDIS_SCOPE,
    LOGGING_ENABLED: 'false',
    SKIP_LOAD_ENV: 'true',
    SKIP_LOAD_CONFIG: 'true'
  }

  if (!process.core_env.DEV_MESSAGING_PATH) {
    messagingServerProcess = spawn(getMessagingBinaryPath(), [], { env, stdio: 'inherit' })
  } else {
    const file = path.resolve(process.core_env.DEV_MESSAGING_PATH, 'index.js')
    messagingServerProcess = fork(file, undefined, { execArgv: undefined, env, cwd: path.dirname(file) })
  }

  messagingServerProcess?.on('exit', (code, signal) => {
    onProcessExit({
      processType: 'messaging',
      code,
      signal,
      logger,
      restartMethod: async () => {
        await startMessagingServer(initialParams, logger)
      }
    })
  })
}
