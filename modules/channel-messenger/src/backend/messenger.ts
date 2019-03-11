import axios, { AxiosInstance } from 'axios'
import bodyParser from 'body-parser'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import { Router } from 'express'
import _ from 'lodash'

import { Config } from '../config'

const outgoingTypes = ['text', 'typing', 'login_prompt', 'carousel']
type MessengerAction = 'typing_on' | 'typing_off' | 'mark_seen'

export class MessengerService {
  private readonly http = axios.create({ baseURL: 'https://graph.facebook.com/v2.6/me' })

  private messengerClients: { [key: string]: MessengerClient } = {}
  private router: Router

  constructor(private bp: typeof sdk) {}

  initialize() {
    this.router = this.bp.http.createRouterForBot('channel-messenger', { checkAuthentication: false })
    this.router.use(
      bodyParser.json({
        verify: this._verifySignature.bind(this)
      })
    )

    this.router.get('/webhook', this._setupWebhook.bind(this))
    this.router.post('/webhook', this._handleIncomingMessage.bind(this))

    this.bp.events.registerMiddleware({
      description: 'Sends outgoing messages for the messenger channel',
      direction: 'outgoing',
      handler: this._handleOutgoingEvent.bind(this),
      name: 'messenger.sendMessages',
      order: 200
    })
  }

  getMessengerClient(botId: string): MessengerClient {
    if (this.messengerClients[botId]) {
      return this.messengerClients[botId]
    }

    this.messengerClients[botId] = new MessengerClient(botId, this.bp, this.http)
    return this.messengerClients[botId]
  }

  // See: https://developers.facebook.com/docs/messenger-platform/webhook#security
  private async _verifySignature(req, res, buffer) {
    const client = this.getMessengerClient(req.params.botId)
    const config = await client.getConfig()
    const signatureError = new Error("Couldn't validate the request signature.")

    if (!/^\/webhook/i.test(req.path)) {
      return
    }

    const signature = req.headers['x-hub-signature']
    if (!signature) {
      throw signatureError
    } else {
      const [, hash] = signature.split('=')
      const expectedHash = crypto
        .createHmac('sha1', config.verifyToken)
        .update(buffer)
        .digest('hex')

      if (hash != expectedHash) {
        throw signatureError
      }
    }
  }

  private async _handleIncomingMessage(req, res) {
    const body = req.body
    const botId = req.params.botId
    const client = this.getMessengerClient(botId)

    if (body.object !== 'page') {
      res.sendStatus(404)
      return
    }

    for (const entry of body.entry) {
      // Will only ever contain one message, so we get index 0
      const webhookEvent = entry.messaging[0]
      const senderId = webhookEvent.sender.id

      await client.sendAction(senderId, 'mark_seen')

      if (webhookEvent.message) {
        await this._sendEvent(botId, senderId, webhookEvent.message, { type: 'message' })
      } else if (webhookEvent.postback) {
        await this._sendEvent(botId, senderId, { text: webhookEvent.postback.payload }, { type: 'callback' })
      }
    }

    res.status(200).send('EVENT_RECEIVED')
  }

  private async _sendEvent(botId: string, senderId: string, message, args: { type: string }) {
    this.bp.events.sendEvent(
      this.bp.IO.Event({
        botId,
        channel: 'messenger',
        direction: 'incoming',
        payload: message,
        preview: message.text,
        target: senderId,
        ...args
      })
    )
  }

  private async _setupWebhook(req, res) {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    const botId = req.params.botId

    const client = this.getMessengerClient(botId)
    const config = await client.getConfig()

    if (mode && token && mode === 'subscribe' && token === config.verifyToken) {
      this.bp.logger.forBot(botId).debug('Webhook Verified.')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }

    await client.setupGreeting()
    await client.setupGetStarted()
    await client.setupPersistentMenu()
  }

  private async _handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'messenger') {
      return next()
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    const messenger = this.getMessengerClient(event.botId)

    if (!_.includes(outgoingTypes, messageType)) {
      return next(new Error('Unsupported event type: ' + event.type))
    }

    if (messageType === 'typing') {
      await messenger.sendAction(event.target, 'typing_on')
    } else if (messageType === 'text' || messageType === 'carousel') {
      await messenger.sendTextMessage(event.target, event.payload)
    } else {
      // TODO We don't support sending files, location requests (and probably more) yet
      throw new Error(`Message type "${messageType}" not implemented yet`)
    }

    next(undefined, false)
  }
}

export class MessengerClient {
  private config: Config

  constructor(private botId: string, private bp: typeof sdk, private http: AxiosInstance) {}

  async getConfig(): Promise<Config> {
    if (this.config) {
      return this.config
    }

    const config = (await this.bp.config.getModuleConfigForBot('channel-messenger', this.botId)) as Config
    if (!config) {
      throw new Error(`Could not find channel-messenger.json config file for ${this.botId}.`)
    }

    return config
  }

  async setupGetStarted(): Promise<void> {
    const config = await this.getConfig()
    if (!config.getStarted) {
      return
    }

    const body = {
      get_started: {
        payload: config.getStarted
      }
    }

    await this.sendProfile(body)
  }

  async setupGreeting(): Promise<void> {
    const config = await this.getConfig()
    if (!config.greeting) {
      return
    }

    const payload = {
      greeting: [
        {
          locale: 'default',
          text: config.greeting
        }
      ]
    }

    await this.sendProfile(payload)
  }

  async setupPersistentMenu(): Promise<void> {
    const config = await this.getConfig()
    if (!config.persistentMenu) {
      return
    }

    await this.sendProfile({ persistent_menu: config.persistentMenu })
  }

  async sendAction(senderId: string, action: MessengerAction) {
    const body = {
      recipient: {
        id: senderId
      },
      sender_action: action
    }

    await this._callEndpoint('/messages', body)
  }

  async sendTextMessage(senderId: string, message: string) {
    const body = {
      recipient: {
        id: senderId
      },
      message
    }

    await this._callEndpoint('/messages', body)
  }

  async sendProfile(message) {
    await this._callEndpoint('/messenger_profile', message)
  }

  private async _callEndpoint(endpoint: string, body) {
    const config = await this.getConfig()
    await this.http.post(endpoint, body, { params: { access_token: config.verifyToken } })
  }
}
