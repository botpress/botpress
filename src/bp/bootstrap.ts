import 'bluebird-global'
// tslint:disable-next-line:ordered-imports
import './sdk/rewire'
// tslint:disable-next-line:ordered-imports
import './common/polyfills'

import sdk from 'botpress/sdk'
import chalk from 'chalk'
import cluster from 'cluster'
import { Botpress, Config, Db, Ghost, Logger } from 'core/app'
import center from 'core/logger/center'
import { ModuleLoader } from 'core/module-loader'
import ModuleResolver from 'core/modules/resolver'
import fs from 'fs'
import _ from 'lodash'
import os from 'os'

import { setupMasterNode, WORKER_TYPES } from './cluster'
import { FatalError } from './errors'

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

async function start() {
  await setupDebugLogger()

  if (cluster.isMaster) {
    // The master process only needs getos and rewire
    return setupMasterNode(await getLogger('Cluster'))
  }

  if (cluster.isWorker && process.env.WORKER_TYPE !== WORKER_TYPES.WEB) {
    return
  }
  // Server ID is provided by the master node
  process.SERVER_ID = process.env.SERVER_ID!

  await setupEnv()

  const logger = await getLogger('Launcher')
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

  const modules: sdk.ModuleEntryPoint[] = []

  const globalConfig = await Config.getBotpressConfig()
  const loadingErrors: Error[] = []
  let loadedModulesLog = ''
  let disabledModulesLog = ''
  let erroredModulesLog = ''

  const resolver = new ModuleResolver(logger)

  for (const entry of globalConfig.modules) {
    try {
      if (!entry.enabled) {
        const displayName = entry.location.replace(/^MODULES_ROOT\/|\\/, '')
        disabledModulesLog += os.EOL + `${chalk.dim('⊝')} ${displayName} ${chalk.gray('(disabled)')}`
        continue
      }

      const moduleLocation = await resolver.resolve(entry.location)
      const rawEntry = resolver.requireModule(moduleLocation)
      const displayName = rawEntry?.definition?.name || entry.location

      const entryPoint = ModuleLoader.processModuleEntryPoint(rawEntry, entry.location)
      modules.push(entryPoint)
      process.LOADED_MODULES[entryPoint.definition.name] = moduleLocation
      loadedModulesLog += os.EOL + `${chalk.greenBright('⦿')} ${displayName}`
    } catch (err) {
      erroredModulesLog += os.EOL + `${chalk.redBright('⊗')} ${entry.location} ${chalk.gray('(error)')}`
      loadingErrors.push(new FatalError(err, `Fatal error loading module "${entry.location}"`))
    }
  }

  logger.info(
    `Using ${chalk.bold(modules.length.toString())} modules` + loadedModulesLog + disabledModulesLog + erroredModulesLog
  )

  for (const err of loadingErrors) {
    logger.attachError(err).error('Error while loading some modules, they will be disabled')
  }

  await Botpress.start({ modules }).catch(err => {
    logger.attachError(err).error('Error starting Botpress')

    if (!process.IS_FAILSAFE) {
      process.exit(1)
    }
  })

  logger.info(`Botpress is listening at: ${process.LOCAL_URL}`)
  logger.info(`Botpress is exposed at: ${process.EXTERNAL_URL}`)
}

start().catch(global.printErrorDefault)
