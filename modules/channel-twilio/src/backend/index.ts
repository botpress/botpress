import * as sdk from 'botpress/sdk'
import { Config } from 'src/config'

import { removeMiddleware, setupMiddleware, TwilioClient } from './client'
import { Clients } from './typings'

let router: sdk.http.RouterExtension
const route = '/webhook'
const clients: Clients = {}

const onServerStarted = async (bp: typeof sdk) => {
  await setupMiddleware(bp, clients)
}

const onServerReady = async (bp: typeof sdk) => {
  router = bp.http.createRouterForBot('channel-twilio', {
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
      res.status(404).send('Bot not a twilio bot')
    }
  })
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const config = (await bp.config.getModuleConfigForBot('channel-twilio', botId, true)) as Config

  if (config.enabled) {
    const client = new TwilioClient(bp, botId, config)
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
  await removeMiddleware(bp)
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
