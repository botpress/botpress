import 'bluebird-global'
// tslint:disable-next-line:ordered-imports
import './sdk/rewire'
// tslint:disable-next-line:ordered-imports
import './common/polyfills'

import sdk from 'botpress/sdk'
import chalk from 'chalk'
import { Botpress, Config, Logger } from 'core/app'
import center from 'core/logger/center'
import { ModuleLoader } from 'core/module-loader'
import ModuleResolver from 'core/modules/resolver'
import os from 'os'
import path from 'path'
import { FatalError } from './errors'

const editions = { ce: 'Community', pro: 'Professional', ee: 'Enterprise' }

async function start() {
  const logger = await Logger('Launcher')
  logger.info(chalk`========================================
{bold ${center(`Botpress Server - ${editions[process.env.EDITION!]} Edition`, 40)}}
{dim ${center(`Version ${sdk.version}`, 40)}}
{yellow ${center(`Pre-release`, 40)}}
========================================`)

  global.printErrorDefault = err => {
    logger.attachError(err).error('Unhandled Rejection')
  }

  const modules: sdk.ModuleEntryPoint[] = []
  const globalConfig = await Config.getBotpressConfig()
  const loadingErrors: Error[] = []
  let modulesLog = ''

  const resolver = new ModuleResolver(logger)

  for (const entry of globalConfig.modules) {
    let originalRequirePaths: string[] = []

    try {
      if (!entry.enabled) {
        modulesLog += os.EOL + `${chalk.dim('⊝')} ${entry.location} ${chalk.gray('(disabled)')}`
        continue
      }

      const moduleLocation = await resolver.resolve(entry.location)

      // We bump temporarily bump the module's node_modules in priority
      // So that it loads the local versions of its own dependencies
      originalRequirePaths = global.require.getPaths()
      global.require.overwritePaths([
        path.join(moduleLocation, 'node_production_modules'),
        path.join(moduleLocation, 'node_modules'),
        ...originalRequirePaths
      ])
      const req = require(moduleLocation)
      global.require.overwritePaths(originalRequirePaths)
      originalRequirePaths = []

      const rawEntry = (req.default ? req.default : req) as sdk.ModuleEntryPoint
      const entryPoint = ModuleLoader.processModuleEntryPoint(rawEntry, entry.location)
      modules.push(entryPoint)
      process.LOADED_MODULES[entryPoint.definition.name] = moduleLocation
      modulesLog += os.EOL + `${chalk.greenBright('⦿')} ${entry.location}`
    } catch (err) {
      modulesLog += os.EOL + `${chalk.redBright('⊗')} ${entry.location} ${chalk.gray('(error)')}`
      loadingErrors.push(new FatalError(err, `Fatal error loading module "${entry.location}"`))
    } finally {
      if (originalRequirePaths.length) {
        global.require.overwritePaths(originalRequirePaths)
      }
    }
  }

  logger.info(`Using ${chalk.bold(modules.length.toString())} modules` + modulesLog)

  for (const err of loadingErrors) {
    logger.attachError(err).error('Error starting Botpress')
  }

  if (loadingErrors.length) {
    process.exit(1)
  }

  await Botpress.start({ modules })

  let host = globalConfig.httpServer.host
  host = host === undefined ? 'localhost' : host

  logger.info(`UI Proxy running on http://${host}:${process.PROXY_PORT}/`)
}

start().catch(global.printErrorDefault)
