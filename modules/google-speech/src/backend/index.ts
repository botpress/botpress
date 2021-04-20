import * as sdk from 'botpress/sdk'
import { Config } from 'src/config'

import { setupRouter } from './api'
import { GoogleSpeechClient, setupMiddlewares, INCOMING_MIDDLEWARE_NAME, OUTGOING_MIDDLEWARE_NAME } from './client'
import { Clients } from './typings'

let router: sdk.http.RouterExtension
const MODULE_NAME = 'google-speech'
const clients: Clients = {}

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddlewares(bp, clients)
}

const onServerReady = async (bp: typeof sdk) => {
  router = await setupRouter(bp, clients, MODULE_NAME)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot(MODULE_NAME, botId, true)) as Config

  if (config.enabled) {
    const client = new GoogleSpeechClient(bp, botId, config)
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
  bp.events.removeMiddleware(INCOMING_MIDDLEWARE_NAME)
  bp.events.removeMiddleware(OUTGOING_MIDDLEWARE_NAME)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'google-speech',
    menuIcon: 'none',
    fullName: 'GoogleSpeech',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [],
    experimental: true
  }
}

export default entryPoint
