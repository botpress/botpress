import * as sdk from 'botpress/sdk'

import { ChannelUnsupportedError, Clients, UnauthorizedError } from './typings'

export async function setupRouter(
  bp: typeof sdk,
  clients: Clients,
  baseRoute: string,
  channelName: string
): Promise<sdk.http.RouterExtension> {
  const router = bp.http.createRouterForBot(channelName, {
    checkAuthentication: false
  })

  router.post(`${baseRoute}/inbound`, async (req, res) => {
    const { botId } = req.params
    const client = clients[botId]

    if (!client) {
      return res.status(404).send(`Bot ${botId} is not a vonage bot`)
    }

    try {
      client.validate(req)

      await client.handleWebhookRequest(req.body)
      res.sendStatus(200)
    } catch (err) {
      if (err instanceof ChannelUnsupportedError) {
        res.status(400).send(err.message)
      } else if (err instanceof UnauthorizedError) {
        res.status(401).send(err.message)
      } else {
        console.error(`[${channelName}] Server error: `, err)
        res.sendStatus(500)
      }
    }
  })

  router.post(`${baseRoute}/status`, async (_req, res) => {
    res.sendStatus(200)
  })

  return router
}
