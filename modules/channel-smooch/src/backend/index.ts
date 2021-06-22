import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import { removeMiddleware, setupMiddleware, SmoochClient } from './client'
import { Clients } from './typings'

let router
const route = '/webhook'
const clients: Clients = {}

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)
}

const onServerReady = async (bp: typeof sdk) => {
  router = bp.http.createRouterForBot('channel-smooch', {
    checkAuthentication: false
  })

  router.post(route, async (req, res) => {
    const { botId } = req.params
    const client = clients[botId]

    if (client) {
      if (client.auth(req)) {
        await client.handleWebhookRequest(req.body)
        res.sendStatus(200)
      } else {
        res.status(401).send('Auth token invalid')
      }
    } else {
      res.status(404).send('Bot not a smooch bot')
    }
  })
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-smooch', botId, true)) as Config

  if (config.enabled) {
    const client = new SmoochClient(bp, botId, config, router, route)
    await client.initialize()

    clients[botId] = client
  }
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  const client = clients[botId]
  if (!client) {
    return
  }

  if (!process.CLUSTER_ENABLED) {
    // Avoid leftover webhooks
    await client.removeWebhook()
  }
  delete clients[botId]
}

const onModuleUnmount = async (bp: typeof sdk) => {
  await removeMiddleware(bp)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'channel-smooch',
    fullName: 'Smooch',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [],
    experimental: true
  }
}

export default entryPoint
