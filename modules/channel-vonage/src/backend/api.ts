import * as sdk from 'botpress/sdk'
import { ResponseError } from 'common/http'

import { Clients } from './typings'

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
      if (err instanceof ResponseError) {
        res.status(err.statusCode).send(err.message)
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
