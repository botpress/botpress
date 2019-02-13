import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import { Router } from 'express'

import { Config } from '../config'

export class MessengerService {
  private readonly http = axios.create({ baseURL: 'https://graph.facebook.com/v2.6/me' })

  private botsMessengers: { [key: string]: ScopedMessengerService } = {}
  private router: Router

  constructor(private bp: typeof sdk) {}

  initialize() {
    this.router = this.bp.http.createRouterForBot('channel-messenger', { checkAuthentication: false })
    this.router.get('/webhook', this._setupWebhook.bind(this))
    this.router.post('/webhook', this._handleMessage.bind(this))
  }

  forBot(botId: string): ScopedMessengerService {
    if (this.botsMessengers[botId]) {
      return this.botsMessengers[botId]
    }

    this.botsMessengers[botId] = new ScopedMessengerService(botId, this.bp, this.http)
    return this.botsMessengers[botId]
  }

  async _handleMessage(req, res) {
    const body = req.body
    const botId = req.params.botId
    const messenger = await this.forBot(botId)

    if (body.object !== 'page') {
      res.sendStatus(404)
      return
    }

    for (const entry of body.entry) {
      // Will only ever contain one message, so we get index 0
      const webhookEvent = entry.messaging[0]
      const senderId = webhookEvent.sender.id

      if (webhookEvent.message) {
        await messenger.handleMessage(senderId, webhookEvent.message)
      } else if (webhookEvent.postback) {
        await messenger.handleMessage(senderId, { text: webhookEvent.postback.payload })
      }
    }

    res.status(200).send('EVENT_RECEIVED')
  }

  async _setupWebhook(req, res) {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    const botId = req.params.botId

    const messenger = await this.forBot(botId)
    const config = await messenger.getConfig()

    if (mode && token && mode === 'subscribe' && token === config.verifyToken) {
      this.bp.logger.forBot(botId).debug('Webhook Verified.')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }

    await messenger.setupGreeting()
    await messenger.setupGetStarted()
  }
}

export class ScopedMessengerService {
  private config: Config

  constructor(private botId: string, private bp: typeof sdk, private http: AxiosInstance) {}

  async handleMessage(senderId: string, message) {
    this.config = await this.getConfig()

    if (message.text) {
      const content = await this.bp.converse.sendMessage(this.botId, senderId, message, 'messenger')

      // Responses are split into pairs {typing, message}
      for (let i = 0; i < content.responses.length; i += 2) {
        const isTyping = content.responses[i].value
        const message = content.responses[i + 1]

        isTyping && (await this._sendAction(senderId, 'typing_on'))
        await this._sendMessage(senderId, message)
        isTyping && (await this._sendAction(senderId, 'typing_off'))
      }
    }
  }

  async getConfig(): Promise<Config> {
    if (this.config) {
      return this.config
    }

    return this.bp.config.getModuleConfigForBot('channel-messenger', this.botId)
  }

  async setupGetStarted(): Promise<void> {
    const message = this.config.getStarted
    if (!message) {
      return
    }

    const body = {
      get_started: {
        payload: message
      }
    }

    await this._sendProfile(body)
  }

  async setupGreeting(): Promise<void> {
    const message = this.config.greeting
    if (!message) {
      return
    }

    const payload = {
      greeting: [
        {
          locale: 'default',
          text: message
        }
      ]
    }

    await this._sendProfile(payload)
  }

  private async _sendAction(psid, action) {
    const body = {
      recipient: {
        id: psid
      },
      sender_action: action
    }

    await this.http.post(`/messages`, body, { params: { access_token: this.config.verifyToken } })
  }

  private async _sendMessage(psid, message) {
    const body = {
      recipient: {
        id: psid
      },
      message
    }

    await this.http.post(`/messages`, body, { params: { access_token: this.config.verifyToken } })
  }

  private async _sendProfile(message) {
    await this.http.post(`messenger_profile?access_token=${this.config.verifyToken}`, message)
  }
}
