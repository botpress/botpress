import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import Telegraf from 'telegraf'

import { Config } from '../config'

import { setupBot, setupMiddleware } from './client'
import { Clients } from './typings'

const clients: Clients = {}

const onServerReady = async (bp: typeof sdk) => {}
const onServerStarted = async (bp: typeof sdk) => {
  setupMiddleware(bp, clients)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-telegram', botId)) as Config

  if (config.enabled) {
    const bot = new Telegraf(config.botToken)
    clients[botId] = bot
    bot.startPolling()
    await setupBot(bp, botId, clients)
  }
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  const client = clients[botId]
  if (!client) {
    return
  }

  client.stop()
  delete clients[botId]
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('telegram.sendMessages')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'channel-telegram',
    menuIcon: 'none', // no interface = true
    fullName: 'Telegram',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: []
  }
}

export default entryPoint
