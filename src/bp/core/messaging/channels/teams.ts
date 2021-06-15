import { HTTPServer } from 'core/app/server'
import { GhostService } from 'core/bpfs'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { MessagingClient } from '../messaging-client'
import { MessagingService } from '../messaging-service'
import { Channel } from './base'

export class ChannelTeams extends Channel {
  get name() {
    return 'teams'
  }

  constructor(private client: MessagingClient, private messaging: MessagingService, private ghost: GhostService) {
    super()
  }

  async loadConfigForBot(botId: string) {
    return this.ghost.forBot(botId).readFileAsObject('config', 'channel-teams.json')
  }

  setupRoutes(http: HTTPServer) {
    const router = http.createRouterForBot('channel-teams', 'messaging', {
      checkAuthentication: false,
      enableJsonBodyParser: false,
      enableUrlEncoderBodyParser: false
    })

    router.use(
      '/api/messages',
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
