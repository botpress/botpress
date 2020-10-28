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
import Engine from 'nlu-core/engine'
import { setupMasterNode, WORKER_TYPES } from '../cluster'
import Logger from '../simple-logger'
import API, { APIOptions } from './api'
import { getConfig } from './config'
import makeLoggerWrapper from './logger-wrapper'

const debug = DEBUG('api')

type ArgV = APIOptions & {
  config?: string
}

export default async function(options: ArgV) {
  const logger = new Logger('Launcher')
  if (cluster.isMaster) {
    setupMasterNode(logger)
    return
  } else if (cluster.isWorker && process.env.WORKER_TYPE !== WORKER_TYPES.WEB) {
    return
  }

  if (!bytes(options.bodySize)) {
    throw new Error(`Specified body-size "${options.bodySize}" has an invalid format.`)
  }

  options.modelDir = options.modelDir || path.join(process.APP_DATA_PATH, 'models')

  let config: NLU.Config
  try {
    config = await getConfig(options.config)
  } catch (err) {
    logger.attachError(err).error(
      `Config file ${options.config} could not be read. \
        Make sure the file exists and that it contains an actual NLU Config in a JSON format.`
    )
    process.exit(1) // TODO: this should also exit master process... Find a way to do so in cluster.ts
  }

  const loggerWrapper = makeLoggerWrapper(logger)
  try {
    await Engine.initialize(config, loggerWrapper)
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

  const { nluVersion } = Engine.getVersionInfo()

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

  if (options.config) {
    if (config.ducklingEnabled) {
      logger.info(`duckling: ${chalk.greenBright('enabled')} url=${config.ducklingURL}`)
    } else {
      logger.info(`duckling: ${chalk.redBright('disabled')}`)
    }

    for (const source of config.languageSources) {
      logger.info(`lang server: url=${source.endpoint}`)
    }
  }

  logger.info(`body size: allowing HTTP resquests body of size ${options.bodySize}`)

  if (options.batchSize > 0) {
    logger.info(`batch size: allowing up to ${options.batchSize} predictions in one call to POST /predict`)
  }

  await API(options, nluVersion)
}
