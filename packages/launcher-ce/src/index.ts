require('dotenv').config(process.env.NODE_ENV === 'production' ? {} : { path: './.env.local' })

import startProxy from '@botpress/xx-ui'
import BPromise from 'bluebird'
import { ModuleDefinition } from 'botpress-module-sdk'
import { Botpress, Logger } from 'botpress-xx'

import chalk from 'chalk'

async function start() {
  try {
    const logger = await Logger('[Launcher]')

    logger.info(chalk`===========================`)
    logger.info(chalk`=     {bold Botpress Server}     =`)
    logger.info(chalk`=       Version 0.1       =`)
    logger.info(chalk`=       {yellow Pre-release}       =`)
    logger.info(chalk`===========================`)

    const modules = new Map<string, ModuleDefinition>()

    modules.set('channel-web', require('@botpress/channel-web') as ModuleDefinition)

    await Botpress.start({
      modules
    })

    await BPromise.fromCallback(cb =>
      startProxy({ core_api_url: 'http://localhost:3000', proxy_host: 'http://localhost', proxy_port: '3001' }, cb)
    )

    logger.info(`UI Proxy running on http://localhost:3001/`)
  } catch (e) {
    console.log(chalk.red('Error starting botpress'))
    console.log(e)
  }
}

start()
