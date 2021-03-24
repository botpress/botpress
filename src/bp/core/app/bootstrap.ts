import 'bluebird-global'
// eslint-disable-next-line import/order
import '../../sdk/rewire'
// eslint-disable-next-line import/order
import '../../common/polyfills'

import sdk from 'botpress/sdk'
import chalk from 'chalk'
import cluster from 'cluster'
import { BotpressApp, createApp, createLoggerProvider } from 'core/app/core-loader'
import { ModuleConfigEntry } from 'core/config'
import { centerText, LoggerProvider } from 'core/logger'
import { ModuleLoader, ModuleResolver } from 'core/modules'

import fs from 'fs'
import _ from 'lodash'
import os from 'os'

import { setupMasterNode, WORKER_TYPES } from '../../cluster'

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

async function prepareLocalModules(app: BotpressApp, logger: sdk.Logger) {
  if (!app.ghost.useDbDriver) {
    return
  }

  try {
    // We remove the local copy in case something is deleted from the database
    await app.ghost.root(false).deleteFolder('modules')
  } catch (err) {
    logger.attachError(err).warn('Could not clear local modules cache')
  }

  await app.ghost.root().syncDatabaseFilesToDisk('modules')
}

async function start() {
  if (cluster.isMaster) {
    const loggerProvider = createLoggerProvider()
    await setupDebugLogger(loggerProvider)
    // The master process only needs getos and rewire
    return setupMasterNode(await getLogger(loggerProvider, 'Cluster'))
  }

  const app = createApp()
  await setupDebugLogger(app.logger)

  if (process.env.WORKER_TYPE === WORKER_TYPES.LOCAL_ACTION_SERVER) {
    app.localActionServer.listen()
    return
  }

  if (cluster.isWorker && process.env.WORKER_TYPE !== WORKER_TYPES.WEB) {
    return
  }

  // Server ID is provided by the master node
  process.SERVER_ID = process.env.SERVER_ID!

  await setupEnv(app)

  const logger = await getLogger(app.logger, 'Launcher')

  await prepareLocalModules(app, logger)

  const globalConfig = await app.config.getBotpressConfig()
  const modules = _.uniqBy(globalConfig.modules, x => x.location)
  const enabledModules = modules.filter(m => m.enabled)
  const disabledModules = modules.filter(m => !m.enabled)

  const resolver = new ModuleResolver(logger)

  const { loadedModules, erroredModules } = await resolveModules(enabledModules, resolver)

  for (const loadedModule of loadedModules) {
    process.LOADED_MODULES[loadedModule.entryPoint.definition.name] = loadedModule.moduleLocation
  }

  logger.info(chalk`========================================
{bold ${centerText('Botpress Server', 40, 9)}}
{dim ${centerText(`Version ${sdk.version}`, 40, 9)}}
{dim ${centerText(`OS ${process.distro}`, 40, 9)}}
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

  logger.info(`App Data Dir: "${process.APP_DATA_PATH}"`)

  const loadedModulesLog = loadedModules
    .map(m => m.rawEntry?.definition?.name || m.entry.location)
    .reduce((log, displayName) => {
      return log + os.EOL + `${chalk.greenBright('⦿')} ${displayName}`
    }, '')

  const disabledModulesLog = disabledModules.reduce((log, module) => {
    const displayName = module.location.replace(/^MODULES_ROOT\/|\\/, '')
    return log + os.EOL + `${chalk.dim('⊝')} ${displayName} ${chalk.gray('(disabled)')}`
  }, '')

  const erroredModulesLog = erroredModules.reduce((log, module) => {
    return (log += os.EOL + `${chalk.redBright('⊗')} ${module.entry.location} ${chalk.gray('(error)')}`)
  }, '')

  logger.info(
    `Using ${chalk.bold(loadedModules.length.toString())} modules` +
      loadedModulesLog +
      disabledModulesLog +
      erroredModulesLog
  )

  for (const err of erroredModules.map(m => m.err)) {
    logger.attachError(err).error('Error while loading some modules, they will be disabled')
  }

  await app.botpress.start({ modules: loadedModules.map(m => m.entryPoint) }).catch(err => {
    logger.attachError(err).error('Error starting Botpress')

    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })

  logger.info(`Botpress is listening at: ${process.LOCAL_URL}`)
  logger.info(`Botpress is exposed at: ${process.EXTERNAL_URL}`)
}

start().catch(global.printErrorDefault)
