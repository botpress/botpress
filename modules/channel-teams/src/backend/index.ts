import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import { Router } from 'express'

import { Config } from '../config'

import { setupMiddleware, TeamsClient } from './client'
import { Clients } from './typings'

const clients: Clients = {}

const onServerReady = async (bp: typeof sdk) => {}

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const router = bp.http.createRouterForBot('channel-teams', {
    checkAuthentication: false
  })
  const config = (await bp.config.getModuleConfigForBot('channel-teams', botId)) as Config

  if (config.enabled) {
    const bot = new TeamsClient(bp, botId, config, router)
    await bot.initialize()

    clients[botId] = bot
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
  bp.events.removeMiddleware('teams.sendMessages')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'channel-teams',
    menuIcon: 'none', // no interface = true
    fullName: 'Teams',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: []
  }
}

export default entryPoint
