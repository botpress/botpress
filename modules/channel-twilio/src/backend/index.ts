import * as sdk from 'botpress/sdk'
import { Config } from 'src/config'

import { setupRouter } from './api'
import { MIDDLEWARE_NAME, setupMiddleware, TwilioClient } from './client'
import { Clients } from './typings'

let router: sdk.http.RouterExtension
const route = '/webhook'
const clients: Clients = {}

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)
}

const onServerReady = async (bp: typeof sdk) => {
  router = await setupRouter(bp, clients, route)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-twilio', botId, true)) as Config

  if (config.enabled) {
    const client = new TwilioClient(bp, botId, config, router, route)
    await client.initialize()

    clients[botId] = client
  }
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
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
    name: 'channel-twilio',
    menuIcon: 'none',
    fullName: 'Twilio',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [],
    experimental: true
  }
}

export default entryPoint
