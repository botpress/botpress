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

async function start() {
  const logger = await Logger('Launcher')
  logger.info(chalk`========================================
{bold ${center(`Botpress Server`, 40)}}
{dim ${center(`Version ${sdk.version}`, 40)}}
{dim ${center(`OS ${process.distro.toString()}`, 40)}}
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
    try {
      if (!entry.enabled) {
        modulesLog += os.EOL + `${chalk.dim('⊝')} ${entry.location} ${chalk.gray('(disabled)')}`
        continue
      }

      const moduleLocation = await resolver.resolve(entry.location)
      const rawEntry = resolver.requireModule(moduleLocation)

      const entryPoint = ModuleLoader.processModuleEntryPoint(rawEntry, entry.location)
      modules.push(entryPoint)
      process.LOADED_MODULES[entryPoint.definition.name] = moduleLocation
      modulesLog += os.EOL + `${chalk.greenBright('⦿')} ${entry.location}`
    } catch (err) {
      modulesLog += os.EOL + `${chalk.redBright('⊗')} ${entry.location} ${chalk.gray('(error)')}`
      loadingErrors.push(new FatalError(err, `Fatal error loading module "${entry.location}"`))
    }
  }

  logger.info(`Using ${chalk.bold(modules.length.toString())} modules` + modulesLog)

  for (const err of loadingErrors) {
    logger.attachError(err).error('Error starting Botpress')
  }

  if (loadingErrors.length) {
    process.exit(1)
  }

  await Botpress.start({ modules }).catch(err => {
    logger.attachError(err).error('Error starting Botpress')
    process.exit(1)
  })

  logger.info(`Botpress is ready at http://${process.HOST}:${process.PORT}/`)
}

start().catch(global.printErrorDefault)
