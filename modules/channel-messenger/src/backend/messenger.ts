import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import { Router } from 'express'

import { Config } from '../config'

export class Messenger {
  private readonly http = axios.create({ baseURL: 'https://graph.facebook.com/v2.6/me' })

  private botsMessengers: { [key: string]: ScopedMessenger } = {}
  private router: Router

  constructor(private bp: typeof sdk) {}

  initialize() {
    this.router = this.bp.http.createRouterForBot('channel-messenger', { checkAuthentication: false })
    this.router.get('/webhook', this._setupWebhook.bind(this))
    this.router.post('/webhook', this._handleMessage.bind(this))
  }

  forBot(botId: string): ScopedMessenger {
    if (this.botsMessengers[botId]) {
      return this.botsMessengers[botId]
    }

    this.botsMessengers[botId] = new ScopedMessenger(botId, this.bp, this.http)
    return this.botsMessengers[botId]
  }

  async _handleMessage(req, res) {
    const body = req.body
    const botId = req.params.botId
    const messenger = await this.forBot(botId)

    if (body.object === 'page') {
      for (const entry of body.entry) {
        // will only ever contain one message, so we get index 0
        const webhookEvent = entry.messaging[0]
        console.log(webhookEvent)
        const senderId = webhookEvent.sender.id

        if (webhookEvent.message) {
          await messenger.handleMessage(senderId, webhookEvent.message)
        } else if (webhookEvent.postback) {
          await messenger.handleMessage(senderId, { text: webhookEvent.postback.payload })
        }
      }

      res.status(200).send('EVENT_RECEIVED')
    } else {
      res.sendStatus(404)
    }
  }

  async _setupWebhook(req, res) {
    const botId = req.params.botId
    const messenger = await this.forBot(botId)

    // Parse the query params
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    const config = await messenger.getConfig()

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === config.verifyToken) {
        this.bp.logger.forBot(botId).debug('Webhook Verified.')
        res.status(200).send(challenge)
      } else {
        res.sendStatus(403)
      }
    } else {
      res.sendStatus(404)
    }

    // Setup greeting and get started here because its only get called once
    await messenger.setupGreeting()
    await messenger.setupGetStarted()
  }
}

export class ScopedMessenger {
  private config: Config

  constructor(private botId: string, private bp: typeof sdk, private http: AxiosInstance) {}

  async onWebHookVerify(req): Promise<string> {
    this.config = await this.getConfig()
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === this.getConfig()) {
        this.bp.logger.forBot(this.botId).debug('Webhook Verified')
        return challenge
      }
    }

    throw new Error()
  }

  async handleMessage(senderId: string, message) {
    this.config = await this.getConfig()
    const content = await this.bp.converse.sendMessage(this.botId, senderId, message, 'messenger')

    if (message.text) {
      // Responses are split into typing / content pairs
      for (let i = 0; i < content.responses.length; i += 2) {
        const isTyping = content.responses[i].value
        const message = content.responses[i + 1]

        isTyping && (await this._sendAction(senderId, 'typing_on'))
        await this._sendMessage(senderId, message)
        isTyping && (await this._sendAction(senderId, 'typing_off'))
      }
    }
  }

  async getConfig(): Promise<any> {
    if (this.config) {
      return this.config
    }

    return await this.bp.config.getModuleConfigForBot('channel-messenger', this.botId)
  }

  async setupGetStarted() {
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

  async setupGreeting() {
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
