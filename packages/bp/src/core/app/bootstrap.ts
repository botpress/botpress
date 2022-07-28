import 'bluebird-global'
// eslint-disable-next-line import/order
import '../../sdk/rewire'
import sdk from 'botpress/sdk'
import chalk from 'chalk'
import cluster from 'cluster'
import { BotpressApp, createApp, createLoggerProvider } from 'core/app/core-loader'
import { ModuleConfigEntry } from 'core/config'
import { LoggerProvider } from 'core/logger'
import { ModuleLoader, ModuleResolver } from 'core/modules'
import fs from 'fs'
import isElevated from 'is-elevated'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import { setupMasterNode, setupWebWorker, WorkerType } from 'orchestrator'
import os from 'os'
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

interface LoadedModule {
  entry: ModuleConfigEntry
  entryPoint: sdk.ModuleEntryPoint
  rawEntry: sdk.ModuleEntryPoint
  moduleLocation: string
}

interface ErroredModule {
  entry: ModuleConfigEntry
  err?: Error
  message?: string
}

async function resolveModules(moduleConfigs: ModuleConfigEntry[], resolver: ModuleResolver) {
  const loadedModules: LoadedModule[] = []
  const erroredModules: ErroredModule[] = []

  for (const entry of moduleConfigs) {
    try {
      const moduleLocation = await resolver.resolve(entry.location)
      if (moduleLocation) {
        const rawEntry = resolver.requireModule(moduleLocation)
        const entryPoint = ModuleLoader.processModuleEntryPoint(rawEntry, entry.location)
        loadedModules.push({ entry, entryPoint, rawEntry, moduleLocation })
      } else {
        erroredModules.push({ entry, message: 'Module not found' })
      }
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
  const loggerProvider = createLoggerProvider()
  if (cluster.isMaster) {
    await setupDebugLogger(loggerProvider)
    const logger = await getLogger(loggerProvider, 'Cluster')

    if (await isElevated()) {
      logger.warn(
        'You are running Botpress as a privileged user. This is not recommended. Please consider running it as an unprivileged user.'
      )
    }

    // The master process only needs getos and rewire
    return setupMasterNode(logger)
  }

  await setupDebugLogger(loggerProvider)
  const app = createApp()

  if (process.env.WORKER_TYPE === WorkerType.LOCAL_ACTION_SERVER) {
    app.localActionServer.listen()
    return
  }

  if (cluster.isWorker && process.env.WORKER_TYPE !== WorkerType.WEB) {
    return
  }

  setupWebWorker()

  await setupEnv(app)

  const logger = await getLogger(app.logger, 'Launcher')

  await prepareLocalModules(app, logger)

  const globalConfig = await app.config.getBotpressConfig()
  const modules = _.uniqBy(globalConfig.modules, x => x.location)
  const enabledModules = modules.filter(m => m.enabled)
  const disabledModules = modules.filter(m => !m.enabled)

  const resolver = new ModuleResolver(logger)

  // eslint-disable-next-line prefer-const
  let { loadedModules, erroredModules } = await resolveModules(enabledModules, resolver)

  // These channels were removed on 12.24.0.
  // Do not display not found errors as migrations are run after loading modules and will fix those errors.
  const removedChannels = ['messenger', 'teams', 'telegram', 'twilio', 'slack', 'smooch', 'vonage']
  erroredModules = erroredModules.filter(m => !removedChannels.some(removed => m.entry.location.includes(removed)))

  for (const loadedModule of loadedModules) {
    process.LOADED_MODULES[loadedModule.entryPoint.definition.name] = loadedModule.moduleLocation
  }

  showBanner({ title: 'Botpress Server', version: sdk.version, logScopeLength: 9, bannerWidth: 75, logger })

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

  for (const { entry, err, message } of erroredModules) {
    if (err) {
      logger.attachError(err).error(`Error while loading module ${entry.location}`)
    } else {
      logger.error(`Error while loading module ${entry.location}: ${message}`)
    }
  }

  await app.botpress.start({ modules: loadedModules.map(m => m.entryPoint) }).catch(err => {
    logger.attachError(err).error('Error starting Botpress')

    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })

  // This ensures that the last log displayed is the correct URL
  await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

  logger.info('')
  logger.info('='.repeat(75))
  logger.info('-->  Documentation is available at    📘 https://botpress.com/docs')
  logger.info('-->  Ask your questions on            👥 https://forum.botpress.com')
  logger.info('='.repeat(75))
  logger.info('')

  logger.info(chalk.bold('Botpress is ready. open the Studio in your favorite browser.'))
  logger.info(chalk.bold(`Botpress is listening at ${process.LOCAL_URL} (browser)`))
  logger.info(chalk.bold(`Botpress is exposed at ${process.EXTERNAL_URL}`))
}

start().catch(global.printErrorDefault)
