import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import { Router } from 'express'
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

    // TODO: && cluster enabled
    if (process.EXTERNAL_URL) {
      const webhookURL = process.EXTERNAL_URL + `/api/v1/bots/${botId}/mod/channel-telegram/secrets`
      const router = bp.http.createRouterForBot('channel-telegram', {
        checkAuthentication: false,
        enableJsonBodyParser: false // telegraf webhook has its custom body parser
      }) as Router

      router.use((req, res, next) => {
        console.log('===>', req.url, webhookURL)
        next()
      })

      router.use(bot.webhookCallback('/secrets'))
      await bot.telegram.setWebhook(webhookURL)
    } else {
      // Must delete webhook prior to using getUpdates()
      await bot.telegram.deleteWebhook()
      bot.startPolling()
    }

    clients[botId] = bot
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
