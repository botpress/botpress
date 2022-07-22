import { ChildProcess, spawn } from 'child_process'
import _ from 'lodash'
import path from 'path'

import { NLUServerOptions } from './typings'

// This will display those keys in the Debug panel so the user can enable them
DEBUG('nlu:training')
DEBUG('nlu:predict')

export const DEFAULT_NLU_SERVER_OPTIONS: NLUServerOptions = {
  host: 'localhost',
  port: 3200,
  maxTraining: 2,
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
  logFilter: undefined,
  legacyElection: false
}

export const getNluBinaryPath = () => {
  const basePath = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../')
  return path.resolve(basePath, `bin/nlu${process.distro.os === 'win32' ? '.exe' : ''}`)
}

let nluServerProcess: ChildProcess | undefined

export const runNluServerWithArgv = (argv: string[]): Promise<{ code: number | null; signal: string | null }> => {
  return new Promise(async (resolve, reject) => {
    try {
      // some vscode NODE_OPTIONS seem to break the nlu binary
      const processEnv = { ...process.env, NODE_OPTIONS: '' }

      nluServerProcess = spawn(getNluBinaryPath(), argv, {
        env: processEnv,
        stdio: 'inherit'
      })

      nluServerProcess.on('exit', (code, signal) => {
        nluServerProcess = undefined
        resolve({ code, signal })
      })
    } catch (err) {
      nluServerProcess = undefined
      reject(err)
    }
  })
}
