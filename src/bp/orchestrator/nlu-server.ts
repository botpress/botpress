import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import { ChildProcess, fork, spawn } from 'child_process'
import _ from 'lodash'
import { DEFAULT_STAN_OPTIONS, getNluBinaryPath } from 'nlu'
import path from 'path'
import portFinder from 'portfinder'

import { NLUServerOptions } from '../nlu/typings'
import { MessageType, onProcessExit, registerProcess, registerMsgHandler } from './master'

let initialParams: Partial<NLUServerOptions>

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
    NLU_SERVER_CONFIG: JSON.stringify({ ...options, port }),
    INTERNAL_PASSWORD: process.INTERNAL_PASSWORD,
    DEBUG: opts.enabledScopes
  }

  if (!process.core_env.DEV_NLU_PATH) {
    nluServerProcess = spawn(getNluBinaryPath(), [], { env, stdio: 'inherit' })
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

let nluClient: AxiosInstance | undefined

export const nluServerActions = {
  getDebugScopes: async (): Promise<object> => {
    try {
      if (nluClient) {
        const { data } = await nluClient.get('/getDebugScopes')
        return data || {}
      }
    } catch {}

    return {}
  },
  setDebugScopes: async (scopes: string) => {
    try {
      await nluClient?.post('/setDebugScopes', { scopes })
    } catch {}
  }
}

export const initNluServerClient = () => {
  nluClient = axios.create({
    headers: { authorization: process.INTERNAL_PASSWORD },
    baseURL: `http://localhost:${process.NLU_PORT}/api/internal`
  })
}
