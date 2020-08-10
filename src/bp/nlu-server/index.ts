import chalk from 'chalk'
import fs from 'fs'
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
import API, { APIOptions } from './api'
import { NLUServerLogger } from './logger'

const debug = DEBUG('api')

export interface ArgV extends NLU.Config {
  port: number
  host: string
  modelDir: string
  limit: number
  limitWindow: string
  authToken?: string
  adminToken?: string
}

export default async function(options: ArgV) {
  options.modelDir = options.modelDir || path.join(process.APP_DATA_PATH, 'models')

  const logger = new NLUServerLogger('Launcher')
  const loggerWrapper: NLU.Logger = {
    info: (msg: string) => logger.info(msg),
    warning: (msg: string, err?: Error) => (err ? logger.attachError(err).warn(msg) : logger.warn(msg)),
    error: (msg: string, err?: Error) => (err ? logger.attachError(err).error(msg) : logger.error(msg))
  }
  await Engine.initialize(options, loggerWrapper)

  global.printLog = args => {
    const message = args[0]
    const rest = args.slice(1)

    logger.level(LogLevel.DEV).debug(message.trim(), rest)
  }

  debug('Language Server Options %o', options)

  const { nluVersion: version } = Engine.getVersionInfo()
  const apiOptions: APIOptions = {
    version,
    host: options.host,
    port: options.port,
    modelDir: options.modelDir,
    authToken: options.authToken,
    limit: options.limit,
    limitWindow: options.limitWindow,
    adminToken: options.adminToken || ''
  }

  logger.info(chalk`========================================
{bold ${center(`Botpress NLU Server`, 40, 9)}}
{dim ${center(`Version ${version}`, 40, 9)}}
{dim ${center(`OS ${process.distro}`, 40, 9)}}
${_.repeat(' ', 9)}========================================`)

  if (options.authToken?.length) {
    logger.info(`authToken: ${chalk.greenBright('enabled')} (only users with this token can query your server)`)
  } else {
    logger.info(`authToken: ${chalk.redBright('disabled')} (anyone can query your language server)`)
  }

  if (options.adminToken?.length) {
    logger.info(`adminToken: ${chalk.greenBright('enabled')} (only users using this token can manage the server)`)
  } else {
    logger.info(`adminToken: ${chalk.redBright('disabled')} (anyone can add, remove or change languages)`)
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

  await Promise.all([API(apiOptions)])
}
