import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import { setupMiddleware, SlackClient } from './client'
import { Clients } from './typings'

let router
const clients: Clients = {}

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)
}

const onServerReady = async (bp: typeof sdk) => {
  router = bp.http.createRouterForBot('channel-slack', {
    checkAuthentication: false,
    enableJsonBodyParser: false,
    enableUrlEncoderBodyParser: false
  })
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-slack', botId, true)) as Config

  if (config.enabled) {
    const bot = new SlackClient(bp, botId, config, router)
    await bot.initialize()

    clients[botId] = bot
  }
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  const client = clients[botId]
  if (!client) {
    return
  }

  await client.shutdown()
  delete clients[botId]
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'channel-slack',
    menuIcon: 'none',
    menuText: 'Channel Slack',
    noInterface: true,
    fullName: 'Slack',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
