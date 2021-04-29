import child_process from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import os from 'os'
import path from 'path'
import { NLUServerOptions } from './typings'
export { NLUServerOptions as StanOptions } from './typings'

const BASE_DOWNLOAD_URL = 'https://github.com/botpress/nlu/releases/download/v0.0.1-rc.1'
const FILE_NAMES = {
  win32: 'nlu-v0_0_1-win-x64.exe',
  darwin: 'nlu-v0_0_1-darwin-x64',
  linux: 'nlu-v0_0_1-linux-x64'
}
const FILE_URLS = _.mapValues(FILE_NAMES, f => `${BASE_DOWNLOAD_URL}/${f}`)

const SIG_KILL = 'SIGKILL'

const DEFAULT_STAN_OPTIONS: NLUServerOptions = {
  host: 'localhost',
  port: 3200,
  authToken: process.APP_SECRET,
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
  silent: true
}

const _getNLUBinaryPath = () => {
  const baseLocation =
    (process.core_env.NLU_BIN_DIR && path.resolve(process.env.NLU_BIN_DIR!)) ||
    (process.pkg ? path.resolve(path.dirname(process.execPath), 'nlu') : path.resolve(process.APP_DATA_PATH, 'nlu'))

  const operatingSys = os.platform()
  const expectedFileName = FILE_NAMES[operatingSys]
  if (!expectedFileName) {
    throw new Error(`Operating system ${operatingSys} is not supported by Botpress.`)
  }
  const expectedFilePath = path.join(baseLocation, expectedFileName)

  // TODO: make this code atempt to download the file instead
  if (!fs.existsSync(expectedFilePath)) {
    let message = 'Could not find NLU executable binary file in the following path: \n'
    message += `  - ${expectedFilePath} \n`
    message += `You can dowload it using the following link: ${FILE_URLS[operatingSys]}. \n`
    message += 'Use the env variable NLU_BIN_DIR to set where you NLU binary is located.'
    throw new Error(message)
  }

  return expectedFilePath
}

let nluServerProcess: child_process.ChildProcess | undefined

export const runNluServerWithEnv = (
  opts: Partial<NLUServerOptions>
): Promise<{ code: number | null; signal: string | null }> => {
  return new Promise((resolve, reject) => {
    try {
      const isDefined = _.negate(_.isUndefined)
      const nonNullOptions = _.pickBy(opts, isDefined)
      const options = { ...DEFAULT_STAN_OPTIONS, ...nonNullOptions }
      const STAN_JSON_CONFIG = JSON.stringify(options)

      const binPath = _getNLUBinaryPath()

      // some vscode NODE_OPTIONS seem to break the nlu binary
      const processEnv = { ...process.env, NODE_OPTIONS: '' }

      nluServerProcess = child_process.spawn(binPath, [], {
        env: { ...processEnv, STAN_JSON_CONFIG },
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

export const runNluServerWithArgv = (argv: string[]): Promise<{ code: number | null; signal: string | null }> => {
  return new Promise((resolve, reject) => {
    try {
      const binPath = _getNLUBinaryPath()

      // some vscode NODE_OPTIONS seem to break the nlu binary
      const processEnv = { ...process.env, NODE_OPTIONS: '' }

      nluServerProcess = child_process.spawn(binPath, argv, {
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

export const killStan = () => {
  if (nluServerProcess) {
    nluServerProcess.kill(SIG_KILL)
  }
}
