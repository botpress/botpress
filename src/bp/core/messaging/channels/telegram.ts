import { HTTPServer } from 'core/app/server'
import { GhostService } from 'core/bpfs'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { MessagingClient } from '../messaging-client'
import { MessagingService } from '../messaging-service'
import { Channel } from './base'

export class ChannelTelegram extends Channel {
  get name() {
    return 'telegram'
  }

  constructor(private client: MessagingClient, private messaging: MessagingService, private ghost: GhostService) {
    super()
  }

  async loadConfigForBot(botId: string) {
    return this.ghost.forBot(botId).readFileAsObject('config', 'channel-telegram.json')
  }

  setupRoutes(http: HTTPServer) {
    const router = http.createRouterForBot('channel-telegram', 'messaging', {
      checkAuthentication: false,
      enableJsonBodyParser: false,
      enableUrlEncoderBodyParser: false
    })

    router.use(
      '/webhook',
      createProxyMiddleware({
        router: req => {
          const { botId } = req.params
          const newUrl = `${this.client.baseUrl}/webhooks/${this.messaging.getClientForBot(botId).providerName}/${
            this.name
          }`
          return newUrl
        },
        changeOrigin: false
      })
    )
  }
}
