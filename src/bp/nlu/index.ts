import * as sdk from 'botpress/sdk'
import child_process from 'child_process'
import fse from 'fs-extra'
import _ from 'lodash'
import os from 'os'
import path from 'path'

import { NLUServerOptions } from './typings'
export { NLUServerOptions as StanOptions } from './typings'

const FILE_PATTERNS: Dic<RegExp> = {
  win32: /nlu-v(\d+_\d+_\d+)-win-x64\.exe/,
  darwin: /nlu-v(\d+_\d+_\d+)-darwin-x64/,
  linux: /nlu-v(\d+_\d+_\d+)-linux-x64/
}

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

const _getNLUBinaryPath = async () => {
  const baseLocation =
    (process.core_env.NLU_BIN_DIR && path.resolve(process.core_env.NLU_BIN_DIR!)) ||
    (process.pkg ? path.resolve(path.dirname(process.execPath)) : path.resolve(process.PROJECT_LOCATION))

  const operatingSys = os.platform()

  if (!Object.keys(FILE_PATTERNS).includes(operatingSys)) {
    throw new Error(`Operating system ${operatingSys} is not supported by Botpress.`)
  }

  const filePattern = FILE_PATTERNS[operatingSys]
  const allValidFiles = (await fse.readdir(baseLocation)).filter(f => filePattern.exec(f))

  if (allValidFiles.length < 1) {
    let message = `Could not find NLU executable binary file in the following path "${baseLocation}". `
    message +=
      'If this is not the directory where your nlu executable is located, you can set it with env variable NLU_BIN_DIR. \n'
    throw new Error(message)
  }

  if (allValidFiles.length > 1) {
    let message = 'The following binary executable nlu files where found: \n'
    for (const file of allValidFiles) {
      message += `  - ${file} \n`
    }
    message += 'Please keep only one of these so Botpress knows which one to start.'
    throw new Error(message)
  }

  const fileName = allValidFiles[0]
  return path.join(baseLocation, fileName)
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

      const binPath = await _getNLUBinaryPath()

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
      const binPath = await _getNLUBinaryPath()

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
