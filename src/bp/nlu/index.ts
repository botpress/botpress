import * as sdk from 'botpress/sdk'
import child_process from 'child_process'
import cliProgress from 'cli-progress'
import fs from 'fs'
import _ from 'lodash'
import ms from 'ms'
import os from 'os'
import path from 'path'
import { downloadBin } from './download'
import { NLUServerOptions } from './typings'
export { NLUServerOptions as StanOptions } from './typings'

const BASE_DOWNLOAD_URL = 'https://github.com/botpress/nlu/releases/download/v0.0.1-rc.3'

// Equivalent of strictly tagging NLU versions
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

const _sleep = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
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

  return path.join(baseLocation, expectedFileName)
}

const _getNLUBinaryPathOrDownload = async (logger?: sdk.Logger) => {
  const expectedFilePath = _getNLUBinaryPath()

  // TODO: make this code atempt to download the file instead
  if (!fs.existsSync(expectedFilePath)) {
    const operatingSys = os.platform()
    const downloadUrl = FILE_URLS[operatingSys]

    let message = 'Could not find NLU executable binary file in the following path: \n'
    message += `  - ${expectedFilePath} \n`
    message +=
      'If this is not the directory where your nlu executable is located, you can set it with env variable NLU_BIN_DIR. \n'
    message += `About to download URL: ${downloadUrl}. \n`
    logger?.warn(message)

    await _sleep(ms('1s')) // To let the server finish booting
    const downloadProgressBar = new cliProgress.Bar({
      format: 'NLU binary executable Download: [{bar}] ({percentage}%), {duration}s',
      stream: process.stdout
    })
    downloadProgressBar.start(100, 0)

    try {
      await downloadBin(downloadUrl, expectedFilePath, (p: number) => {
        // const percent = _.round(p * 100, 2)
        if (p === 1) {
          p = 0.99
        }
        downloadProgressBar.update(p * 100)
      })
      downloadProgressBar.update(100)
      downloadProgressBar.stop()
    } catch (err) {
      logger?.error('Could not download NLU binary executable.')
      throw err
    }
  }

  return expectedFilePath
}

let nluServerProcess: child_process.ChildProcess | undefined

export const runNluServerWithEnv = (
  opts: Partial<NLUServerOptions>,
  logger: sdk.Logger
): Promise<{ code: number | null; signal: string | null }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const isDefined = _.negate(_.isUndefined)
      const nonNullOptions = _.pickBy(opts, isDefined)
      const options = { ...DEFAULT_STAN_OPTIONS, ...nonNullOptions }
      const STAN_JSON_CONFIG = JSON.stringify(options)

      const binPath = await _getNLUBinaryPathOrDownload(logger)

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
  return new Promise(async (resolve, reject) => {
    try {
      const binPath = await _getNLUBinaryPathOrDownload()

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
