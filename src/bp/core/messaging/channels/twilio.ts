import { HTTPServer } from 'core/app/server'
import { GhostService } from 'core/bpfs'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { MessagingClient } from '../messaging-client'
import { MessagingService } from '../messaging-service'
import { Channel } from './base'

export class ChannelTwilio extends Channel {
  get name() {
    return 'twilio'
  }

  constructor(private client: MessagingClient, private messaging: MessagingService, private ghost: GhostService) {
    super()
  }

  async loadConfigForBot(botId: string) {
    const baseConfig = await this.ghost.forBot(botId).readFileAsObject<any>('config', 'channel-twilio.json')

    return {
      ...baseConfig,
      webhookUrl: `${process.EXTERNAL_URL}/api/v1/bots/${botId}/mod/channel-twilio/webhook`
    }
  }

  setupRoutes(http: HTTPServer) {
    const router = http.createRouterForBot('channel-twilio', 'messaging', {
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
