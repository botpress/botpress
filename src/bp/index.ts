#!yarn start

import 'bluebird-global'
import 'common/polyfills'
import center from 'core/logger/center'
import 'core/modules-resolver'
import 'sdk/rewire'
import 'sdk/rewire'

import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { Botpress, Config, Logger } from 'core/app'
import { FatalError } from 'core/errors'
import { ModuleLoader } from 'core/module-loader'
import os from 'os'
const { start: startProxy } = require('./http/api')

async function start() {
  try {
    const logger = await Logger('Launcher')

    logger.info(chalk`===============================
{bold ${center(`Botpress Server`, 30)}}
{dim ${center(`Version ${sdk.version}`, 30)}}
{yellow ${center(`Pre-release`, 30)}}
===============================`)

    process.on('unhandledRejection', err => {
      logger.error('Unhandled Rejection', err)
    })

    process.on('uncaughtException', err => {
      logger.error('Fatal Error (uncaught). Process will exit.', err)
      process.exit(1)
    })

    const modules: sdk.ModuleEntryPoint[] = []
    const globalConfig = await Config.getBotpressConfig()
    const loadingErrors: Error[] = []
    let modulesLog = ''

    for (const entry of globalConfig.modules) {
      try {
        if (!entry.enabled) {
          modulesLog += os.EOL + `${chalk.dim('⊝')} ${entry.location} ${chalk.gray('(disabled)')}`
          continue
        }

        const req = require(entry.location)
        const rawEntry = (req.default ? req.default : req) as sdk.ModuleEntryPoint
        const entryPoint = ModuleLoader.processModuleEntryPoint(rawEntry, entry.location)
        modules.push(entryPoint)
        modulesLog += os.EOL + `${chalk.greenBright('⦿')} ${entry.location}`
      } catch (err) {
        modulesLog += os.EOL + `${chalk.redBright('⊗')} ${entry.location} ${chalk.gray('(error)')}`
        loadingErrors.push(new FatalError(err, `Fatal error loading module "${entry.location}"`))
      }
    }

    logger.info(`Loaded ${chalk.bold(modules.length.toString())} modules` + modulesLog)

    for (const err of loadingErrors) {
      logger.error('Error starting Botpress', err)
    }

    if (loadingErrors.length) {
      process.exit(1)
    }

    await Botpress.start({ modules })

    await Promise.fromCallback(cb =>
      startProxy({ coreApiUrl: 'http://localhost:3000', proxyHost: 'http://localhost', proxyPort: '3001' }, cb)
    )

    logger.info(`UI Proxy running on http://localhost:3001/`)
  } catch (e) {
    console.log(chalk.red('Error starting botpress'))
    console.log(e)
  }
}

start()
