import 'common/polyfills'
import 'bluebird-global'
import 'common/rewire'

import chalk from 'chalk'
import { Logger, Botpress } from 'core/app'
import * as sdk from 'botpress/sdk'
const { start: startProxy } = require('./http/api')

async function start() {
  try {
    const logger = await Logger('Launcher')

    logger.info(chalk`===========================`)
    logger.info(chalk`= {bold Botpress Server} `)
    logger.info(chalk`=  Version ${sdk.version} `)
    logger.info(chalk`=  {yellow Pre-release} `)
    logger.info(chalk`===========================`)

    process.on('unhandledRejection', err => {
      logger.error('Unhandled Rejection', err)
    })

    process.on('uncaughtException', err => {
      logger.error('Fatal Error (uncaught). Process will exit.', err)
      process.exit(1)
    })

    const modules = new Map<string, sdk.ModuleDefinition>()

    // modules.set('channel-web', require('@botpress/channel-web') as ModuleDefinition)

    await Botpress.start({
      modules
    })

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
