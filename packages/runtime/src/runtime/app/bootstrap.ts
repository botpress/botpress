import 'bluebird-global'
// eslint-disable-next-line import/order
import '../../sdk/rewire'
import sdk from 'botpress/runtime-sdk'
import { BotpressApp, createApp, createLoggerProvider } from 'runtime/app/core-loader'
import { LoggerProvider } from 'runtime/logger'

import { showBanner } from './banner'

async function setupEnv(app: BotpressApp) {
  await app.database.initialize()

  const useDbDriver = process.BPFS_STORAGE === 'database'
  await app.ghost.initialize(useDbDriver)
}

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
      .level(sdk.LogLevel.DEBUG)
      .persist(false)
      .forBot(botId)
      .debug(message.trim(), rest)
  }

  global.printLog = args => {
    const message = args[0]
    const rest = args.slice(1)

    logger
      .level(sdk.LogLevel.DEBUG)
      .persist(false)
      .noEmit() // We don't want to emit global debugs to the studio (ex: audit, configurations)
      .debug(message.trim(), rest)
  }
}

export async function start() {
  await setupDebugLogger(createLoggerProvider())
  const app = createApp()

  await setupEnv(app)

  const logger = await getLogger(app.logger, 'Launcher')

  showBanner({ title: 'Botpress Runtime', version: sdk.version, logScopeLength: 9, bannerWidth: 75, logger })

  await app.botpress.start().catch(err => {
    logger.attachError(err).error('Error starting Botpress')

    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })

  logger.info(`Botpress is listening at: ${process.LOCAL_URL}`)
  logger.info(`Botpress is exposed at: ${process.EXTERNAL_URL}`)
}
