import * as sdk from 'botpress/sdk'
import { Config } from 'src/config'

import { GoogleSpeechClient } from './client'
import { Middleware } from './middleware'
import { Clients } from './typings'

let middleware: Middleware
const MODULE_NAME = 'google-speech'
const clients: Clients = {}

const onServerStarted = async (bp: typeof sdk) => {
  middleware = new Middleware(bp, clients)

  middleware.setup()
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

  await clients[botId].close()
  delete clients[botId]
}

const onModuleUnmount = async (_bp: typeof sdk) => {
  middleware.remove()
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'google-speech',
    fullName: 'GoogleSpeech',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [],
    experimental: true
  }
}

export default entryPoint
