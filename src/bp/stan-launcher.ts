import child_process from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import os from 'os'
import path from 'path'

export interface LanguageSource {
  endpoint: string
  authToken?: string
}

export interface StanOptions {
  host: string
  port: number
  authToken?: string
  silent: boolean

  limitWindow?: string
  limit: number
  bodySize: string
  batchSize: number
  dbURL?: string
  modelDir?: string

  // engine options
  languageSources: LanguageSource[]
  ducklingURL: string
  ducklingEnabled: boolean
  modelCacheSize: string
}

const SIG_KILL = 'SIGKILL'

const DEFAULT_STAN_OPTIONS: StanOptions = {
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

let stanProcess: child_process.ChildProcess | undefined

export const runStan = (opts: Partial<StanOptions>): Promise<{ code: number | null; signal: string | null }> => {
  const options = { ...DEFAULT_STAN_OPTIONS, ...opts }

  return new Promise((resolve, reject) => {
    try {
      const STAN_JSON_CONFIG = JSON.stringify(options)
      const command = path.join(__dirname, 'index.js') // TODO change this when we have a bin
      stanProcess = child_process.fork(command, ['nlu'], {
        env: { ...process.env, STAN_JSON_CONFIG },
        stdio: 'inherit'
      })

      stanProcess.on('exit', (code, signal) => {
        stanProcess = undefined
        resolve({ code, signal })
      })
    } catch (err) {
      stanProcess = undefined
      reject(err)
    }
  })
}

export const killStan = () => {
  if (stanProcess) {
    stanProcess.kill(SIG_KILL)
  }
}

const getNLUBinariesPath = () => {
  return (
    (process.core_env.NLU_BIN_DIR && path.resolve(process.env.NLU_BIN_DIR!)) ||
    (process.pkg ? path.resolve(path.dirname(process.execPath), 'nlu') : path.resolve(process.APP_DATA_PATH, 'nlu'))
  )
}

const baseDownloadUrl = 'https://github.com/botpress/nlu/releases/download/v0.0.1-rc.1'
const fileNames = {
  win32: 'nlu-v0_0_1-win-x64.exe',
  darwin: 'nlu-v0_0_1-darwin-x64',
  linux: 'nlu-v0_0_1-linux-x64'
}
const nluDownloadUrl = _.mapValues(fileNames, f => `${baseDownloadUrl}/${f}`)

export const startNLUFromBinary = (argv: string[]) => {
  const binPath = getNLUBinariesPath()
  const operatingSys = os.platform()
  const expectedFileName = fileNames[operatingSys]
  if (!expectedFileName) {
    throw new Error(`Operating system ${operatingSys} is not supported by Botpress.`)
  }
  const expectedFilePath = path.join(binPath, expectedFileName)

  // TODO: make this code atempt to download the file instead
  if (!fs.existsSync(expectedFilePath)) {
    throw new Error(
      `Could not find NLU executable binary file. You can dowload it using the following link: ${nluDownloadUrl[operatingSys]}. Use the env variable NLU_BIN_DIR to set where you NLU binary is located.`
    )
  }

  child_process.spawn(expectedFilePath, argv, { env: { ...process.env }, stdio: 'inherit' })
}
