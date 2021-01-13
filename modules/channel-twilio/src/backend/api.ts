import * as sdk from 'botpress/sdk'

import { Clients } from './typings'

export async function setupRouter(bp: typeof sdk, clients: Clients, route: string): Promise<sdk.http.RouterExtension> {
  const router = bp.http.createRouterForBot('channel-twilio', {
    checkAuthentication: false
  })

  router.post(route, async (req, res) => {
    const { botId } = req.params
    const client = clients[botId]

    if (!client) {
      return res.status(404).send('Bot not a twilio bot')
    }

    if (client.auth(req)) {
      await client.handleWebhookRequest(req.body)
      res.sendStatus(204)
    } else {
      res.status(401).send('Auth token invalid')
    }
  })

  return router
}
