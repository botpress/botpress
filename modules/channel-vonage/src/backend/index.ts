import * as sdk from 'botpress/sdk'
import { Config } from 'src/config'

import { setupRouter } from './api'
import { MIDDLEWARE_NAME, setupMiddleware, VonageClient } from './client'
import { Clients } from './typings'

let router: sdk.http.RouterExtension
const baseRoute = '/webhooks'
const clients: Clients = {}

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)
}

const onServerReady = async (bp: typeof sdk) => {
  router = await setupRouter(bp, clients, baseRoute)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-vonage', botId, true)) as Config

  if (config.enabled) {
    const client = new VonageClient(bp, botId, config, router, baseRoute)
    await client.initialize()

    clients[botId] = client
  }
}

const onBotUnmount = async (_bp: typeof sdk, botId: string) => {
  const client = clients[botId]
  if (!client) {
    return
  }

  delete clients[botId]
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware(MIDDLEWARE_NAME)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'channel-vonage',
    menuIcon: 'none',
    fullName: 'Vonage',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [],
    experimental: true
  }
}

export default entryPoint
