#!yarn start

import 'bluebird-global'
import 'common/polyfills'
import center from 'core/logger/center'
import 'core/modules-resolver'
import 'sdk/rewire'
import 'sdk/rewire'

import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { Botpress, Logger } from 'core/app'
import { FatalError } from 'core/errors'
import { ModuleLoader } from 'core/module-loader'
const { start: startProxy } = require('./http/api')

async function start() {
  try {
    const logger = await Logger('Launcher')

    logger.info(chalk`===============================`)
    logger.info(chalk`{bold ${center(`Botpress Server`, 30)}}`)
    logger.info(chalk`{bold ${center(`Version ${sdk.version}`, 30)}}`)
    logger.info(chalk`{yellow ${center(`Pre-release`, 30)}}`)
    logger.info(chalk`===============================`)

    process.on('unhandledRejection', err => {
      logger.error('Unhandled Rejection', err)
    })

    process.on('uncaughtException', err => {
      logger.error('Fatal Error (uncaught). Process will exit.', err)
      process.exit(1)
    })

    const modules: sdk.ModuleEntryPoint[] = []

    const modulesToLoad = ['bp/modules/channel-web']

    for (const module of modulesToLoad) {
      try {
        const req = require(module)
        const rawEntry = (req.default ? req.default : req) as sdk.ModuleEntryPoint
        const entryPoint = ModuleLoader.processModuleEntryPoint(rawEntry, module)
        modules.push(entryPoint)
      } catch (err) {
        throw new FatalError(err, `Error loading module "${module}"`)
      }
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
