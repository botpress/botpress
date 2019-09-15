import axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import { json as expressJson, Router } from 'express'
import _ from 'lodash'

import { Config } from '../config'

const debug = DEBUG('channel-messenger')
const debugMessages = debug.sub('messages')
const debugHttp = debug.sub('http')
const debugWebhook = debugHttp.sub('webhook')
const debugHttpOut = debugHttp.sub('out')

const outgoingTypes = ['text', 'typing', 'login_prompt', 'carousel']
type MessengerAction = 'typing_on' | 'typing_off' | 'mark_seen'

type MountedBot = { pageId: string; botId: string; client: MessengerClient }

export class MessengerService {
  private readonly http = axios.create({ baseURL: 'https://graph.facebook.com/v3.2/me' })
  private mountedBots: MountedBot[] = []
  private router: Router & sdk.http.RouterExtension
  private appSecret: string

  constructor(private bp: typeof sdk) {}

  async initialize() {
    const config = (await this.bp.config.getModuleConfig('channel-messenger')) as Config

    if (!config.verifyToken || !config.verifyToken.length) {
      throw new Error(
        'You need to set a non-empty value for "verifyToken" in data/global/config/channel-messenger.json'
      )
    }

    if (!config.appSecret || !config.appSecret.length) {
      throw new Error(`You need to set a non-empty value for "appSecret" in data/global/config/channel-messenger.json`)
    }

    this.appSecret = config.appSecret

    this.router = this.bp.http.createRouterForBot('channel-messenger', {
      checkAuthentication: false,
      enableJsonBodyParser: false // we use our custom json body parser instead, see below
    })

    this.router.getPublicPath().then(publicPath => {
      if (publicPath.indexOf('https://') !== 0) {
        this.bp.logger.warn('Messenger requires HTTPS to be setup to work properly. See EXTERNAL_URL botpress config.')
      }

      this.bp.logger.info(`Messenger Webhook URL is ${publicPath.replace('BOT_ID', '___')}/webhook`)
    })

    this.router.use(
      expressJson({
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

  async mountBot(botId: string) {
    const config = (await this.bp.config.getModuleConfigForBot('channel-messenger', botId)) as Config
    if (config.enabled) {
      if (!config.accessToken) {
        return this.bp.logger
          .forBot(botId)
          .error('You need to configure an Access Token to enable it. Messenger Channel is disabled for this bot.')
      }

      const { data } = await this.http.get('/', { params: { access_token: config.accessToken } })

      if (!data || !data.id) {
        return this.bp.logger
          .forBot(botId)
          .error(
            'Could not register bot, are you sure your Access Token is valid? Messenger Channel is disabled for this bot.'
          )
      }

      const pageId = data.id
      const client = new MessengerClient(botId, this.bp, this.http)
      this.mountedBots.push({ botId: botId, client, pageId })

      await client.setupGreeting()
      await client.setupGetStarted()
      await client.setupPersistentMenu()
    }
  }

  async unmountBot(botId: string) {
    this.mountedBots = _.remove(this.mountedBots, x => x.botId === botId)
  }

  getMessengerClientByBotId(botId: string): MessengerClient {
    const entry = _.find(this.mountedBots, x => x.botId === botId)

    if (!entry) {
      throw new Error(`Can't find a MessengerClient for bot "${botId}"`)
    }

    return entry.client
  }

  // See: https://developers.facebook.com/docs/messenger-platform/webhook#security
  private _verifySignature(req, res, buffer) {
    const signatureError = new Error("Couldn't validate the request signature.")

    if (!/^\/webhook/i.test(req.path)) {
      return
    }

    const signature = req.headers['x-hub-signature']
    if (!signature || !this.appSecret) {
      throw signatureError
    } else {
      const [, hash] = signature.split('=')

      const expectedHash = crypto
        .createHmac('sha1', this.appSecret)
        .update(buffer)
        .digest('hex')

      if (hash !== expectedHash) {
        debugWebhook('invalid signature', req.path)
        throw signatureError
      } else {
        debugWebhook('signed', req.path)
      }
    }
  }

  private async _handleIncomingMessage(req, res) {
    const body = req.body

    if (body.object !== 'page') {
      // TODO: Handle other cases here
    } else {
      res.status(200).send('EVENT_RECEIVED')
    }

    for (const entry of body.entry) {
      const pageId = entry.id
      const messages = entry.messaging

      const bot = _.find<MountedBot>(this.mountedBots, { pageId })
      if (!bot) {
        debugMessages('could not find a bot for page id =', pageId)
        continue
      }
      if (!messages) {
         debugMessages('incoming event without messaging entry')
         continue
       }
      for (const webhookEvent of messages) {
        if (!webhookEvent.sender) {
          continue
        }

        debugMessages('incoming', webhookEvent)
        const senderId = webhookEvent.sender.id

        await bot.client.sendAction(senderId, 'mark_seen')

        if (webhookEvent.message) {
          await this._sendEvent(bot.botId, senderId, webhookEvent.message, { type: 'message' })
        } else if (webhookEvent.postback) {
          await this._sendEvent(bot.botId, senderId, { text: webhookEvent.postback.payload }, { type: 'callback' })
        }
      }
    }
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

    const config = (await this.bp.config.getModuleConfig('channel-messenger')) as Config

    if (mode && token && mode === 'subscribe' && token === config.verifyToken) {
      this.bp.logger.debug('Webhook Verified')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }
  }

  private async _handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'messenger') {
      return next()
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    const messenger = this.getMessengerClientByBotId(event.botId)

    if (!_.includes(outgoingTypes, messageType)) {
      return next(new Error('Unsupported event type: ' + event.type))
    }

    if (messageType === 'typing') {
      const typing = parseTyping(event.payload.value)
      await messenger.sendAction(event.target, 'typing_on')
      await Promise.delay(typing)
      await messenger.sendAction(event.target, 'typing_off')
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

    await this.sendProfile({
      get_started: {
        payload: config.getStarted
      }
    })
  }

  async setupGreeting(): Promise<void> {
    const config = await this.getConfig()
    if (!config.greeting) {
      await this.deleteProfileFields(['greeting'])
      return
    }

    await this.sendProfile({
      greeting: [
        {
          locale: 'default',
          text: config.greeting
        }
      ]
    })
  }

  async setupPersistentMenu(): Promise<void> {
    const config = await this.getConfig()
    if (!config.persistentMenu || !config.persistentMenu.length) {
      await this.deleteProfileFields(['persistent_menu'])
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
    debugMessages('outgoing action', { senderId, action, body })
    await this._callEndpoint('/messages', body)
  }

  async sendTextMessage(senderId: string, message: string) {
    const body = {
      recipient: {
        id: senderId
      },
      message
    }

    debugMessages('outgoing text message', { senderId, message, body })
    await this._callEndpoint('/messages', body)
  }

  async deleteProfileFields(fields: string[]) {
    const endpoint = '/messenger_profile'
    const config = await this.getConfig()
    debugHttpOut(endpoint, fields)
    await this.http.delete(endpoint, { params: { access_token: config.accessToken }, data: { fields } })
  }

  async sendProfile(message) {
    await this._callEndpoint('/messenger_profile', message)
  }

  private async _callEndpoint(endpoint: string, body) {
    const config = await this.getConfig()
    debugHttpOut(endpoint, body)
    await this.http.post(endpoint, body, { params: { access_token: config.accessToken } })
  }
}

function parseTyping(typing) {
  if (isNaN(typing)) {
    return 1000
  }

  return Math.max(typing, 500)
}
