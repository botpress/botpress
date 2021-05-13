import 'bluebird-global'
// eslint-disable-next-line import/order
import '../../sdk/rewire'

import sdk from 'botpress/sdk'
import chalk from 'chalk'
import { BotpressApp, createApp } from 'core/app/loader'
import { ModuleConfigEntry } from 'core/config'
import { centerText, LoggerProvider, LogLevel } from 'core/logger'
import { ModuleLoader, ModuleResolver } from 'core/modules'
import fs from 'fs'
import _ from 'lodash'

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
      .debug(message.trim(), rest)
  }
}

interface LoadedModule {
  entry: ModuleConfigEntry
  entryPoint: sdk.ModuleEntryPoint
  rawEntry: sdk.ModuleEntryPoint
  moduleLocation: string
}

interface ErroredModule {
  entry: ModuleConfigEntry
  err: Error
}

async function resolveModules(moduleConfigs: ModuleConfigEntry[], resolver: ModuleResolver) {
  const loadedModules: LoadedModule[] = []
  const erroredModules: ErroredModule[] = []

  for (const entry of moduleConfigs) {
    try {
      const moduleLocation = await resolver.resolve(entry.location)
      const rawEntry = resolver.requireModule(moduleLocation)
      const entryPoint = ModuleLoader.processModuleEntryPoint(rawEntry, entry.location)
      loadedModules.push({ entry, entryPoint, rawEntry, moduleLocation })
    } catch (e) {
      erroredModules.push({ entry, err: e })
    }
  }

  return { loadedModules, erroredModules }
}

async function start() {
  const app = createApp()
  await setupDebugLogger(app.logger)
  await setupEnv(app)

  const globalConfig = await app.config.getBotpressConfig()
  const modules = _.uniqBy(globalConfig.modules, x => x.location)
  const enabledModules = modules.filter(m => m.enabled)

  const logger = await getLogger(app.logger, 'Launcher')
  const resolver = new ModuleResolver(logger)

  const { loadedModules } = await resolveModules(enabledModules, resolver)

  for (const loadedModule of loadedModules) {
    process.LOADED_MODULES[loadedModule.entryPoint.definition.name] = loadedModule.moduleLocation
  }

  logger.info(chalk`========================================
{bold ${centerText('Botpress Studio', 40, 9)}}
${_.repeat(' ', 9)}========================================`)

  if (!fs.existsSync(process.APP_DATA_PATH)) {
    try {
      fs.mkdirSync(process.APP_DATA_PATH)
    } catch (err) {
      logger.attachError(err).error(
        `Could not find/create APP_DATA folder "${process.APP_DATA_PATH}".
Please make sure that Botpress has the right to access this folder or change the folder path by providing the 'APP_DATA_PATH' env variable.
This is a fatal error, process will exit.`
      )

      if (!process.IS_FAILSAFE) {
        process.exit(1)
      }
    }
  }

  await app.botpress.start({ modules: loadedModules.map(m => m.entryPoint) }).catch(err => {
    logger.attachError(err).error('Error starting Botpress Studio')

    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })

  logger.info(`Botpress Studio is listening at: ${process.LOCAL_URL}`)
}

start().catch(global.printErrorDefault)
