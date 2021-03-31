import * as sdk from 'botpress/sdk'

import { Clients } from './typings'

export async function setupRouter(
  bp: typeof sdk,
  clients: Clients,
  baseRoute: string
): Promise<sdk.http.RouterExtension> {
  const router = bp.http.createRouterForBot('channel-vonage', {
    checkAuthentication: false
  })

  router.post(`${baseRoute}/inbound`, async (req, res) => {
    const { botId } = req.params
    const client = clients[botId]

    if (!client) {
      return res.status(404).send(`Bot ${botId} is not a vonage bot`)
    }

    try {
      client.validate(req.body)

      await client.handleWebhookRequest(req.body)
      res.sendStatus(200)
    } catch (err) {
      res.status(400).send(err.message)
    }
  })

  router.post(`${baseRoute}/status`, async (req, res) => {
    const { botId } = req.params
    const client = clients[botId]

    if (!client) {
      return res.status(404).send(`Bot ${botId} is not a vonage bot`)
    }

    await client.handleIncomingMessageStatus(req.body)

    res.sendStatus(200)
  })

  return router
}
