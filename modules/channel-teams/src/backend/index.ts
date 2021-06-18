import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import { setupMiddleware, TeamsClient } from './client'
import { Clients } from './typings'

const clients: Clients = {}
let publicPath: string

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)
}

const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('channel-teams', {
    checkAuthentication: false
  })

  router.post('/api/messages', async (req, res, next) => {
    const client = clients[req.params.botId]
    try {
      client && (await client.receiveIncomingEvent(req, res))
    } catch (err) {
      bp.logger.error(err)
      next(err)
    }
    next()
  })

  publicPath = await router.getPublicPath()
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-teams', botId, true)) as Config

  if (config.enabled) {
    const bot = new TeamsClient(bp, botId, config, publicPath)
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
    fullName: 'Teams',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: []
  }
}

export default entryPoint
