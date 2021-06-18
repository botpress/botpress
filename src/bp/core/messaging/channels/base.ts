import { HTTPServer } from 'core/app/server'
import { GhostService } from 'core/bpfs'
import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { MessagingService } from '..'
import { MessagingClient } from '../messaging-client'

export abstract class Channel {
  abstract get name(): string

  get mergeGlobalConfig(): boolean {
    return false
  }

  private router!: Router

  constructor(private client: MessagingClient, private messaging: MessagingService, private ghost: GhostService) {}

  async loadConfigForBot(botId: string) {
    const fileName = `channel-${this.name}.json`

    if (!(await this.ghost.forBot(botId).fileExists('config', fileName))) {
      return undefined
    }
    const botConfig = await this.ghost.forBot(botId).readFileAsObject<any>('config', fileName)

    if (this.mergeGlobalConfig && (await this.ghost.global().fileExists('config', fileName))) {
      const globalConfig = await this.ghost.global().readFileAsObject<any>('config', fileName)
      return {
        ...globalConfig,
        ...botConfig
      }
    } else {
      return botConfig
    }
  }

  setupRoutes(http: HTTPServer) {
    this.router = http.createRouterForBot(`channel-${this.name}`, 'messaging', {
      checkAuthentication: false,
      enableJsonBodyParser: false,
      enableUrlEncoderBodyParser: false
    })

    this.setupProxies()
  }

  abstract setupProxies(): void

  setupProxy(localRoute: string, messagingRoute?: string) {
    this.router.use(
      localRoute,
      createProxyMiddleware({
        router: req => {
          const { botId } = req.params
          const newUrl = `${this.client.baseUrl}/webhooks/${this.messaging.getClientForBot(botId).providerName}/${
            this.name
          }${messagingRoute ? messagingRoute : ''}`
          return newUrl
        },
        changeOrigin: false,
        logLevel: 'silent'
      })
    )
  }
}
