import 'bluebird-global'
// tslint:disable-next-line:ordered-imports
import './sdk/rewire'
// tslint:disable-next-line:ordered-imports
import './common/polyfills'

import sdk, { logger } from 'botpress/sdk'
import chalk from 'chalk'
import { Botpress, Config, Logger } from 'core/app'
import center from 'core/logger/center'
import { ModuleLoader } from 'core/module-loader'
import ModuleResolver from 'core/modules/resolver'
import os from 'os'
import { FatalError } from './errors'

const { start: startProxy } = require('./http/api')

async function start() {
  const logger = await Logger('Launcher')

  logger.info(chalk`===============================
{bold ${center(`Botpress Server`, 30)}}
{dim ${center(`Version ${sdk.version}`, 30)}}
{yellow ${center(`Pre-release`, 30)}}
===============================`)

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
      const req = require(moduleLocation)
      const rawEntry = (req.default ? req.default : req) as sdk.ModuleEntryPoint
      const entryPoint = ModuleLoader.processModuleEntryPoint(rawEntry, entry.location)
      modules.push(entryPoint)
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

  await Botpress.start({ modules })

  await Promise.fromCallback(cb =>
    startProxy({ coreApiUrl: 'http://localhost:3000', proxyHost: 'http://localhost', proxyPort: '3001' }, cb)
  )

  logger.info(`UI Proxy running on http://localhost:3001/`)
}

start().catch(global.printErrorDefault)
