import * as sdk from 'botpress/sdk'
import { ChildProcess, fork, spawn } from 'child_process'
import _ from 'lodash'
import path from 'path'
import portFinder from 'portfinder'

import { NLUServerOptions } from '../nlu/typings'
import { MessageType, onProcessExit, registerProcess, registerMsgHandler } from './master'

const DEFAULT_STAN_OPTIONS: NLUServerOptions = {
  host: 'localhost',
  port: 3200,
  authToken: undefined,
  limit: 0,
  bodySize: '2mb', // should be more than enough based on empirical trials
  batchSize: 1, // one predict at a time
  languageSources: [
    {
      endpoint: 'https://lang-01.botpress.io'
    }
  ],
  ducklingURL: 'https://duckling.botpress.io',
  ducklingEnabled: true,
  modelCacheSize: '850mb',
  verbose: 3, // info
  doc: false,
  logFilter: '', // TODO: user debug config to generate correct filters
  legacyElection: false
}

let initialParams: Partial<NLUServerOptions>

const getBinaryPath = () => {
  const basePath = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../')
  return path.resolve(basePath, `bin/nlu${process.distro.os === 'win32' ? '.exe' : ''}`)
}

export const registerNluServerMainHandler = (logger: sdk.Logger) => {
  registerMsgHandler(MessageType.StartNluServer, async (message: Partial<NLUServerOptions>) => {
    initialParams = message
    await startNluServer(message, logger)
  })
}

export const startLocalNLUServer = (message: Partial<NLUServerOptions>) => {
  process.send!({ type: MessageType.StartNluServer, ...message })
}

let nluServerProcess: ChildProcess | undefined

export const killNluProcess = () => {
  nluServerProcess?.kill('SIGKILL')
}

export const startNluServer = async (opts: Partial<NLUServerOptions>, logger: sdk.Logger) => {
  const options = _.merge(DEFAULT_STAN_OPTIONS, opts)
  const port = await portFinder.getPortPromise({ port: options.port })

  registerProcess('nlu', port)

  const env = {
    ...process.env,
    // some vscode NODE_OPTIONS seem to break the nlu binary
    NODE_OPTIONS: '',
    STAN_JSON_CONFIG: JSON.stringify({ ...options, port })
  }

  if (!process.core_env.DEV_NLU_PATH) {
    nluServerProcess = spawn(getBinaryPath(), [], { env, stdio: 'inherit' })
  } else {
    const file = path.resolve(process.core_env.DEV_NLU_PATH, 'index.js')
    nluServerProcess = fork(file, undefined, { execArgv: undefined, env, cwd: path.dirname(file) })
  }

  nluServerProcess?.on('exit', (code, signal) => {
    onProcessExit({
      processType: 'nlu',
      code,
      signal,
      logger,
      restartMethod: async () => {
        await startNluServer(initialParams, logger)
      }
    })
  })
}
