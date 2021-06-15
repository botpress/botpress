import { HTTPServer } from 'core/app/server'
import { GhostService } from 'core/bpfs'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { MessagingClient } from '../messaging-client'
import { MessagingService } from '../messaging-service'
import { Channel } from './base'

export class ChannelSlack extends Channel {
  get name() {
    return 'slack'
  }

  constructor(private client: MessagingClient, private messaging: MessagingService, private ghost: GhostService) {
    super()
  }

  async loadConfigForBot(botId: string) {
    return this.ghost.forBot(botId).readFileAsObject('config', 'channel-slack.json')
  }

  setupRoutes(http: HTTPServer) {
    const router = http.createRouterForBot('channel-slack', 'messaging', {
      checkAuthentication: false,
      enableJsonBodyParser: false,
      enableUrlEncoderBodyParser: false
    })

    router.use(
      '/bots/:botId/callback',
      createProxyMiddleware({
        router: req => {
          const { botId } = req.params
          const newUrl = `${this.client.baseUrl}/webhooks/${this.messaging.getClientForBot(botId).providerName}/${
            this.name
          }/interactive`
          return newUrl
        },
        changeOrigin: false
      })
    )

    router.use(
      '/bots/:botId/events-callback',
      createProxyMiddleware({
        router: req => {
          const { botId } = req.params
          const newUrl = `${this.client.baseUrl}/webhooks/${this.messaging.getClientForBot(botId).providerName}/${
            this.name
          }/events`
          return newUrl
        },
        changeOrigin: false
      })
    )
  }
}
