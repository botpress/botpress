import { HTTPServer } from 'core/app/server'
import { GhostService } from 'core/bpfs'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { MessagingClient } from '../messaging-client'
import { MessagingService } from '../messaging-service'
import { Channel } from './base'

export class ChannelVonage extends Channel {
  get name() {
    return 'vonage'
  }

  constructor(private client: MessagingClient, private messaging: MessagingService, private ghost: GhostService) {
    super()
  }

  async loadConfigForBot(botId: string) {
    return this.ghost.forBot(botId).readFileAsObject('config', 'channel-vonage.json')
  }

  setupRoutes(http: HTTPServer) {
    const router = http.createRouterForBot('channel-vonage', 'messaging', {
      checkAuthentication: false,
      enableJsonBodyParser: false,
      enableUrlEncoderBodyParser: false
    })

    router.use(
      '/webhooks/inbound',
      createProxyMiddleware({
        router: req => {
          const { botId } = req.params
          const newUrl = `${this.client.baseUrl}/webhooks/${this.messaging.getClientForBot(botId).providerName}/${
            this.name
          }/inbound`
          return newUrl
        },
        changeOrigin: false
      })
    )

    router.use(
      '/webhooks/status',
      createProxyMiddleware({
        router: req => {
          const { botId } = req.params
          const newUrl = `${this.client.baseUrl}/webhooks/${this.messaging.getClientForBot(botId).providerName}/${
            this.name
          }/status`
          return newUrl
        },
        changeOrigin: false
      })
    )
  }
}
