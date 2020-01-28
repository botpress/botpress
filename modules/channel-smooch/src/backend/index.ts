import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import { Client } from 'knex'

import { Config } from '../config'

import { incomingHandler, setupMiddleware } from './client'
import { Clients } from './typings'

const Smooch = require('smooch-core')

const clients: Clients = {}
let whPath = ''

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)
}

const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('channel-smooch', {
    checkAuthentication: false,
    enableJsonBodyParser: true
  })

  whPath = (await router.getPublicPath()) + '/webhook'

  router.post('/webhook', async (req, res, next) => {
    const { botId } = req.params
    if (clients[botId]) {
      await incomingHandler(bp, botId, req.body)
      return res.sendStatus(200)
    } else {
      res.status(404).send({ message: `Bot "${botId}" not a Smooch bot` })
    }
  })
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-smooch', botId, true)) as Config

  if (config.enabled) {
    const smooch = new Smooch({
      keyId: config.keyId,
      secret: config.secret,
      scope: 'app'
    })

    await smooch.webhooks.create({
      target: whPath.replace('BOT_ID', botId),
      triggers: ['message:appUser'],
      includeClient: true
    })

    clients[botId] = smooch
  }
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  const client = clients[botId]
  if (!client) {
    return
  }

  const target = whPath.replace('BOT_ID', botId)
  const { webhooks } = await client.webhooks.list()
  for (const hook of webhooks) {
    if (hook.target == target) {
      await client.webhooks.delete(hook._id)
    }
  }

  delete clients[botId]
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('smooch.sendMessages')
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
