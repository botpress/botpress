import 'bluebird-global'
// eslint-disable-next-line import/order
import '../../sdk/rewire'

import { RuntimeSetup } from '../../startup/embedded'
import { BotpressApp, createApp, createLoggerProvider } from '../app/core-loader'
import { LoggerProvider, LogLevel } from '../logger'

import { showBanner } from './banner'

async function getLogger(provider: LoggerProvider, loggerName: string) {
  const logger = await provider(loggerName)

  global.printErrorDefault = err => {
    logger.attachError(err).error('Unhandled Rejection')
  }

  return logger
}

async function setupDebugLogger(provider: LoggerProvider) {
  const logger = await provider('')

  global.printBotLog = (botId, args) => {
    const message = args[0]
    const rest = args.slice(1)

    logger
      .level(LogLevel.DEBUG)
      .persist(false)
      .forBot(botId)
      .debug(message.trim(), rest)
  }

  global.printLog = args => {
    const message = args[0]
    const rest = args.slice(1)

    logger
      .level(LogLevel.DEBUG)
      .persist(false)
      .noEmit() // We don't want to emit global debugs to the studio (ex: audit, configurations)
      .debug(message.trim(), rest)
  }
}

const setupEmbedded = async (app: BotpressApp, config: RuntimeSetup) => {
  if (config.clients?.knex) {
    app.database.knex = config.clients.knex
    await app.database.bootstrap()
  } else {
    await app.database.initialize()
  }

  if (config.rootDir) {
    process.PROJECT_LOCATION = config.rootDir
  }

  if (config.endpoints) {
    process.NLU_ENDPOINT = config.endpoints.nlu
    process.MESSAGING_ENDPOINT = config.endpoints.messaging
  }

  return app.botpress.start(config)
}

const setupStandalone = async (app: BotpressApp) => {
  const logger = await getLogger(app.logger, 'Launcher')
  await app.database.initialize()

  showBanner({
    title: 'Botpress Runtime',
    version: process.BOTPRESS_VERSION,
    logScopeLength: 9,
    bannerWidth: 75,
    logger
  })

  await app.botpress.start().catch(err => {
    logger.attachError(err).error('Error starting Botpress')

    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })

  logger.info(`Botpress is listening at: ${process.LOCAL_URL}`)
  logger.info(`Botpress is exposed at: ${process.EXTERNAL_URL}`)
}

export async function start(config?: RuntimeSetup) {
  await setupDebugLogger(createLoggerProvider())
  const app = createApp()

  const useDbDriver = process.BPFS_STORAGE === 'database'
  await app.ghost.initialize(useDbDriver)

  return config ? setupEmbedded(app, config) : setupStandalone(app)
}
