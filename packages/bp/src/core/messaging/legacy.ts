import * as sdk from 'botpress/sdk'
import { HTTPServer } from 'core/app/server'
import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

// TODO: remove this code when we decide to break compatibility with legacy channel routes
export class MessagingLegacy {
  private warned: { [botChannel: string]: boolean } = {}

  constructor(private logger: sdk.Logger, private http: HTTPServer) {}

  setup() {
    const messengerRouter = this.setupRouter(this.http, 'messenger')
    this.setupProxy(messengerRouter, 'messenger', '/webhook')

    const slackRouter = this.setupRouter(this.http, 'slack')
    this.setupProxy(slackRouter, 'slack', '/bots/:botId/callback', '/interactive')
    this.setupProxy(slackRouter, 'slack', '/bots/:botId/events-callback', '/events')

    const smoochRouter = this.setupRouter(this.http, 'smooch')
    this.setupProxy(smoochRouter, 'smooch', '/webhook')

    const teamsRouter = this.setupRouter(this.http, 'teams')
    this.setupProxy(teamsRouter, 'teams', '/api/messages')

    const telegramRouter = this.setupRouter(this.http, 'telegram')
    this.setupProxy(telegramRouter, 'telegram', '/webhook')

    const twilioRouter = this.setupRouter(this.http, 'twilio')
    this.setupProxy(twilioRouter, 'twilio', '/webhook')

    const vonageRouter = this.setupRouter(this.http, 'vonage')
    this.setupProxy(vonageRouter, 'vonage', '/webhooks/inbound', '/inbound')
    this.setupProxy(vonageRouter, 'vonage', '/webhooks/status', '/status')
  }

  private setupRouter(http: HTTPServer, channel: string) {
    return http.createRouterForBot(`channel-${channel}`, 'messaging', {
      checkAuthentication: false,
      enableJsonBodyParser: false,
      enableUrlEncoderBodyParser: false
    })
  }

  private setupProxy(router: Router, channel: string, localRoute: string, messagingRoute?: string) {
    router.use(
      localRoute,
      createProxyMiddleware({
        router: req => {
          const { botId } = req.params

          if (!this.warned[`${botId}-${channel}`]) {
            const correctRoute = `${process.EXTERNAL_URL}/api/v1/messaging/webhooks/${botId}/${channel}${
              messagingRoute ? messagingRoute : ''
            }`
            this.logger.warn(
              `[${botId}] You are using a deprecated route for your channel ${channel} webhook. Please use this route instead : ${correctRoute}`
            )
            this.warned[`${botId}-${channel}`] = true
          }

          const search = new URL(req.originalUrl, process.EXTERNAL_URL).search

          const newUrl = `${this.getMessagingUrl()}/webhooks/${botId}/${channel}${
            messagingRoute ? messagingRoute : ''
          }${search || ''}`

          return newUrl
        },
        changeOrigin: false,
        ignorePath: true,
        logLevel: 'silent'
      })
    )
  }

  private getMessagingUrl() {
    return process.core_env.MESSAGING_ENDPOINT
      ? process.core_env.MESSAGING_ENDPOINT
      : `http://localhost:${process.MESSAGING_PORT}`
  }
}
