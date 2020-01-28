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
      await client.handleWebhookRequest(req.body)
      res.status(200).send()
    } else {
      res.status(404).send({ message: `Bot "${botId}" not a Smooch bot` })
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

  await client.delete()
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
    menuIcon: 'none',
    fullName: 'Smooch',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: []
  }
}

export default entryPoint
