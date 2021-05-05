import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import Telegraf from 'telegraf'
import { Config } from '../config'

import { setupBot, setupMiddleware } from './client'
import { Clients } from './typings'

const clients: Clients = {}
const whMiddleware: any = {}
let useWebhooks: boolean = true
let whPath = ''

const onServerReady = async (bp: typeof sdk) => {
  if (useWebhooks) {
    const router = bp.http.createRouterForBot('channel-telegram', {
      checkAuthentication: false,
      enableJsonBodyParser: false // telegraf webhook has its custom body parser
    })

    whPath = (await router.getPublicPath()) + '/webhook'

    router.use('/webhook', (req, res, next) => {
      const { botId } = req.params
      if (typeof whMiddleware[botId] === 'function') {
        whMiddleware[botId](req, res, next)
      } else {
        res.status(404).send({ message: `Bot "${botId}" not a Telegram bot` })
      }
    })
  }
}

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)

  const config = (await bp.config.getModuleConfig('channel-telegram')) as Config
  useWebhooks = config.forceWebhook || process.CLUSTER_ENABLED
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-telegram', botId, true)) as Config

  if (config.enabled) {
    const bot = new Telegraf(config.botToken)

    if (useWebhooks) {
      // There's a strict limit on the number of calls of the API, so we let only one node register it
      const lock = await bp.distributed.acquireLock(`lock_telegram_${botId}`, 4000)
      if (lock) {
        await bot.telegram.setWebhook(whPath.replace('BOT_ID', botId)).catch(err => {
          // Ignore too many request errors
          if (err.code !== 429) {
            throw err
          }
        })
      }

      whMiddleware[botId] = bot.webhookCallback('/')
    } else {
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
  delete whMiddleware[botId]
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
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: []
  }
}

export default entryPoint
