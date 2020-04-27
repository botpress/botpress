import 'bluebird-global'
// tslint:disable-next-line:ordered-imports
import './sdk/rewire'
// tslint:disable-next-line:ordered-imports
import './common/polyfills'

import sdk from 'botpress/sdk'
import chalk from 'chalk'
import cluster from 'cluster'
import { Botpress, Config, Db, Ghost, LocalActionServer, Logger } from 'core/app'
import center from 'core/logger/center'
import { ModuleLoader } from 'core/module-loader'
import ModuleResolver from 'core/modules/resolver'
import fs from 'fs'
import _ from 'lodash'
import os from 'os'

import { ModuleConfigEntry } from 'core/config/botpress.config'

import { setupMasterNode, WORKER_TYPES } from './cluster'

async function setupEnv() {
  await Db.initialize()

  const useDbDriver = process.BPFS_STORAGE === 'database'
  await Ghost.initialize(useDbDriver)
}

async function getLogger(loggerName: string) {
  const logger = await Logger(loggerName)

  global.printErrorDefault = err => {
    logger.attachError(err).error('Unhandled Rejection')
  }

  return logger
}

async function setupDebugLogger() {
  const logger = await Logger('')

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

async function start() {
  await setupDebugLogger()

  if (cluster.isMaster) {
    // The master process only needs getos and rewire
    return setupMasterNode(await getLogger('Cluster'))
  }

  if (process.env.WORKER_TYPE === WORKER_TYPES.LOCAL_ACTION_SERVER) {
    LocalActionServer.listen()
    return
  }

  if (cluster.isWorker && process.env.WORKER_TYPE !== WORKER_TYPES.WEB) {
    return
  }

  // Server ID is provided by the master node
  process.SERVER_ID = process.env.SERVER_ID!

  await setupEnv()

  const logger = await getLogger('Launcher')

  const globalConfig = await Config.getBotpressConfig()
  const enabledModules = globalConfig.modules.filter(m => m.enabled)
  const disabledModules = globalConfig.modules.filter(m => !m.enabled)

  const resolver = new ModuleResolver(logger)

  const { loadedModules, erroredModules } = await resolveModules(enabledModules, resolver)

  for (const loadedModule of loadedModules) {
    process.LOADED_MODULES[loadedModule.entryPoint.definition.name] = loadedModule.moduleLocation
  }

  logger.info(chalk`========================================
{bold ${center(`Botpress Server`, 40, 9)}}
{dim ${center(`Version ${sdk.version}`, 40, 9)}}
{dim ${center(`OS ${process.distro}`, 40, 9)}}
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

  await Botpress.start({ modules: loadedModules.map(m => m.entryPoint) }).catch(err => {
    logger.attachError(err).error('Error starting Botpress')

    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })

  logger.info(`Botpress is listening at: ${process.LOCAL_URL}`)
  logger.info(`Botpress is exposed at: ${process.EXTERNAL_URL}`)
}

start().catch(global.printErrorDefault)
