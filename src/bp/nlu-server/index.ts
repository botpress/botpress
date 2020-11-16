import bytes from 'bytes'
import chalk from 'chalk'
import cluster from 'cluster'
import _ from 'lodash'
import path from 'path'

import center from '../core/logger/center'
import { LogLevel } from '../core/sdk/enums'

// tslint:disable-next-line:ordered-imports
import rewire from '../sdk/rewire'
// tslint:disable-next-line:ordered-imports

global.rewire = rewire as any
import { NLU } from 'botpress/sdk'
import { copyDir } from 'core/misc/pkg-fs'
import Engine from 'nlu-core/engine'
import { setupMasterNode, WORKER_TYPES } from '../cluster'
import Logger from '../simple-logger'
import API, { APIOptions } from './api'

const debug = DEBUG('api')

type ArgV = APIOptions & {
  languageURL: string
  languageAuthToken?: string
  ducklingURL: string
  ducklingEnabled: boolean
}

export default async function(options: ArgV) {
  const logger = new Logger('Launcher')
  if (cluster.isMaster) {
    setupMasterNode(logger)
    return
  } else if (cluster.isWorker && process.env.WORKER_TYPE !== WORKER_TYPES.WEB) {
    return
  }

  for (const dir of ['./pre-trained', './stop-words']) {
    await copyDir(path.resolve(__dirname, '../nlu-core/language', dir), path.resolve(process.APP_DATA_PATH, dir))
  }

  if (!bytes(options.bodySize)) {
    throw new Error(`Specified body-size "${options.bodySize}" has an invalid format.`)
  }

  const maxCacheSize = bytes(options.modelCacheSize)
  if (!maxCacheSize) {
    throw new Error(`Specified model cache-size "${options.modelCacheSize}" has an invalid format.`)
  }

  options.modelDir = options.modelDir || path.join(process.APP_DATA_PATH, 'models')

  const loggerWrapper = <NLU.Logger>{
    info: (msg: string) => logger.info(msg),
    warning: (msg: string, err?: Error) => (err ? logger.attachError(err).warn(msg) : logger.warn(msg)),
    error: (msg: string, err?: Error) => (err ? logger.attachError(err).error(msg) : logger.error(msg))
  }
  const engine = new Engine({ maxCacheSize })
  try {
    const langConfig: NLU.LanguageConfig = {
      languageSources: [
        {
          endpoint: options.languageURL,
          authToken: options.languageAuthToken
        }
      ],
      ducklingEnabled: options.ducklingEnabled,
      ducklingURL: options.ducklingURL
    }
    await engine.initialize(langConfig, loggerWrapper)
  } catch (err) {
    // TODO: Make lang provider throw if it can't connect.
    logger
      .attachError(err)
      .error(
        'There was an error while initializing Engine tools. Check out the connection to your language and Duckling server.'
      )
    process.exit(1)
  }

  global.printLog = args => {
    const message = args[0]
    const rest = args.slice(1)

    logger.level(LogLevel.DEV).debug(message.trim(), rest)
  }

  debug('NLU Server Options %o', options)

  const { nluVersion } = engine.getVersionInfo()

  logger.info(chalk`========================================
{bold ${center('Botpress NLU Server', 40, 9)}}
{dim ${center(`Version ${nluVersion}`, 40, 9)}}
{dim ${center(`OS ${process.distro}`, 40, 9)}}
${_.repeat(' ', 9)}========================================`)

  if (options.authToken?.length) {
    logger.info(`authToken: ${chalk.greenBright('enabled')} (only users with this token can query your server)`)
  } else {
    logger.info(`authToken: ${chalk.redBright('disabled')} (anyone can query your nlu server)`)
  }

  if (options.limit) {
    logger.info(
      `limit: ${chalk.greenBright('enabled')} allowing ${options.limit} requests/IP address in a ${
        options.limitWindow
      } timeframe `
    )
  } else {
    logger.info(`limit: ${chalk.redBright('disabled')} (no protection - anyone can query without limitation)`)
  }

  if (options.ducklingEnabled) {
    logger.info(`duckling: ${chalk.greenBright('enabled')} url=${options.ducklingURL}`)
  } else {
    logger.info(`duckling: ${chalk.redBright('disabled')}`)
  }
  logger.info(`lang server: url=${options.languageURL}`)

  logger.info(`body size: allowing HTTP resquests body of size ${options.bodySize}`)

  if (options.batchSize > 0) {
    logger.info(`batch size: allowing up to ${options.batchSize} predictions in one call to POST /predict`)
  }

  await API(options, engine)
}
