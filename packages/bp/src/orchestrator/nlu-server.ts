import * as sdk from 'botpress/sdk'
import { ChildProcess, fork, spawn } from 'child_process'
import _ from 'lodash'
import { DEFAULT_NLU_SERVER_OPTIONS, getNluBinaryPath } from 'nlu'
import path from 'path'
import portFinder from 'portfinder'

import { NLUServerOptions } from '../nlu/typings'
import { MessageType, onProcessExit, registerProcess, registerMsgHandler } from './master'
import { getMigrationArgs } from './migrator'

let initialParams: Partial<NLUServerOptions> | undefined

export const registerNluServerMainHandler = (logger: sdk.Logger) => {
  registerMsgHandler(MessageType.StartNluServer, async (message: Partial<NLUServerOptions>) => {
    initialParams = message
    await startNluServer(logger, message)
  })
}

export const startLocalNLUServer = (message: Partial<NLUServerOptions>) => {
  process.send!({ type: MessageType.StartNluServer, ...message })
}

let nluServerProcess: ChildProcess | undefined

export const killNluProcess = () => {
  nluServerProcess?.kill('SIGKILL')
}

export const startNluServer = async (logger: sdk.Logger, opts?: Partial<NLUServerOptions>, onExit?: (err?) => void) => {
  const options = { ...DEFAULT_NLU_SERVER_OPTIONS, ...opts }
  const port = await portFinder.getPortPromise({ port: options.port })

  registerProcess('nlu', port)

  const env = {
    ...process.env,
    // some vscode NODE_OPTIONS seem to break the nlu binary
    NODE_OPTIONS: '',
    NLU_SERVER_CONFIG: JSON.stringify({ ...options, port }),
    ...getMigrationArgs('nlu')
  }

  if (!process.core_env.DEV_NLU_PATH) {
    nluServerProcess = spawn(getNluBinaryPath(), [], { env, stdio: 'inherit' })
  } else {
    const file = path.resolve(process.core_env.DEV_NLU_PATH, 'index.js')
    nluServerProcess = fork(file, undefined, { execArgv: [], env, cwd: path.dirname(file) })
  }

  nluServerProcess?.on('exit', (code, signal) => {
    if (onExit) {
      return onExit()
    }

    onProcessExit({
      processType: 'nlu',
      code,
      signal,
      logger,
      restartMethod: async () => {
        await startNluServer(logger, initialParams)
      }
    })
  })
}
