import * as sdk from 'botpress/sdk'
import * as entities from 'entities'
import { json as expressJson, Router } from 'express'
import _ from 'lodash'
import * as stringUtils from 'mout/string'
import removeMd from 'remove-markdown'
import twilio from 'twilio'

import { Config } from '../config'

import entryPoint from './index'

const debug = DEBUG('channel-twilio')
const debugMessages = debug.sub('messages')
const debugHttp = debug.sub('http')
const debugWebhook = debugHttp.sub('webhook')
const debugHttpOut = debugHttp.sub('out')

type MountedBot = { botId: string; client: TwilioClient }
type FromToMap = { fromNumber: string; language: string }

export class TwilioService {
  private mountedBots: MountedBot[] = []
  private fromToMap: { [toNumber: string]: FromToMap } = {}
  private router: Router & sdk.http.RouterExtension
  private publicPath: string

  constructor(private bp: typeof sdk) {}

  async initialize() {
    const config = (await this.bp.config.getModuleConfig('channel-twilio')) as Config

    if (!config.authToken || !config.authToken.length) {
      throw new Error('You need to set a non-empty value for "authToken" in data/global/config/channel-twilio.json')
    }

    if (!config.accountSID || !config.accountSID.length) {
      throw new Error(`You need to set a non-empty value for "accountSID" in data/global/config/channel-twilio.json`)
    }

    this.router = this.bp.http.createRouterForBot('channel-twilio', {
      checkAuthentication: false,
      enableJsonBodyParser: false // we use our custom json body parser instead, see below
    })

    this.publicPath = await this.router.getPublicPath()
    if (this.publicPath.indexOf('https://') !== 0) {
      this.bp.logger.warn('Twilio requires HTTPS to be setup to work properly. See EXTERNAL_URL botpress config.')
    }

    this.router.post('/webhook', this._handleIncomingMessage.bind(this))

    this.bp.events.registerMiddleware({
      description: 'Processes incoming messages from the twilio channel',
      direction: 'incoming',
      handler: this._handleIncomingEvent.bind(this),
      name: 'twilio.sendMessages',
      order: 100
    })

    this.bp.events.registerMiddleware({
      description: 'Sends outgoing messages for the twilio channel',
      direction: 'outgoing',
      handler: this._handleOutgoingEvent.bind(this),
      name: 'twilio.sendMessages',
      order: 100
    })
  }

  async mountBot(botId: string) {
    const config = (await this.bp.config.getModuleConfigForBot('channel-twilio', botId)) as Config
    if (config.enabled) {
      if (!config.authToken) {
        return this.bp.logger
          .forBot(botId)
          .error('You need to configure an Access Token to enable it. Twilio Channel is disabled for this bot.')
      }
      const client = new TwilioClient(botId, this.bp)
      this.mountedBots.push({ botId: botId, client })

      this.bp.logger.info(`Twilio Webhook URL is ${this.publicPath.replace('BOT_ID', botId)}/webhook`)
    }
  }

  async unmountBot(botId: string) {
    this.mountedBots = _.remove(this.mountedBots, x => x.botId === botId)
  }

  getTwilioClientByBotId(botId: string): TwilioClient {
    const entry = _.find(this.mountedBots, x => x.botId === botId)

    if (!entry) {
      throw new Error(`Can't find a TwilioClient for bot "${botId}"`)
    }

    return entry.client
  }

  private async _handleIncomingMessage(req, res) {
    const { botId } = req.params
    const body = req.body

    debugWebhook('_handleIncomingMessage:', { headers: req.headers, body: req.body })

    res.status(200).send('<Response/>')

    const fromNumber = body.To
    const toNumber = body.From
    this.fromToMap[toNumber] = { fromNumber, language: undefined }

    if (undefined != body.Latitude) {
      this.bp.logger.info('location')
      await this._sendEvent(botId, toNumber, { text: body.Latitude + ',' + body.Longitude }, { type: 'location' })
    } else if ('' != body.Body) {
      this.bp.logger.info('message')
      await this._sendEvent(botId, toNumber, { text: body.Body }, { type: 'text' })
    }
  }

  private async _sendEvent(botId: string, senderId: string, message, args: { type: string }) {
    args.type = message.text.toLowerCase() == 'reset' ? 'session_reset' : args.type || 'text'

    await this.bp.events.sendEvent(
      this.bp.IO.Event({
        botId,
        channel: 'twilio',
        direction: 'incoming',
        payload: message,
        preview: message.text,
        target: senderId,
        ...args
      })
    )
  }

  private async _handleIncomingEvent(event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'twilio') {
      return next()
    }

    const langOptions = [event.nlu.language, event.nlu.detectedLanguage, event.state.user.language]

    let lang = (langOptions.filter(l => l && l !== 'n/a')[0] || 'en').toLowerCase().substring(0, 2)

    if (!entryPoint.translations[lang]) {
      lang = 'en'
    }

    debugMessages(`language[${event.target}]=${lang} - options: `, langOptions)

    this.fromToMap[event.target].language = lang

    next(undefined, false)
  }

  private async _handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'twilio') {
      return next()
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    const recipient = this.fromToMap[event.target]
    const tr = entryPoint.translations[recipient.language]
    const twilio = this.getTwilioClientByBotId(event.botId)

    if (messageType === 'text' || messageType === 'carousel' || messageType === 'dropdown') {
      const elements = event.payload.elements || [event.payload]
      for (const element of elements) {
        let message = element.text || element.message
        const options = element.quick_replies || element.options || element.buttons
        if (messageType === 'carousel') {
          message = element.title + (element.subtitle ? `\n${element.subtitle}` : '')
          for (const option of options) {
            if (option.type === 'open_url') {
              message += `\n\n${option.title}: ${option.url}`
              options.splice(options.indexOf(option), 1)
            }
          }
        }

        if (message) {
          message = stringUtils.stripHtmlTags(entities.decodeHTML(removeMd(message)))
        }

        await twilio.sendTextMessage(event.target, recipient.fromNumber, message)

        if (undefined != options && options.length < 10 && options.length > 0) {
          const quick_replies = options.map(reply => reply.title || reply.label)
          const str = tr['youCanSay'] + quick_replies.join(', ')

          await twilio.sendTextMessage(event.target, recipient.fromNumber, str)
        }
      }
    } else if (messageType === 'location') {
      await twilio.sendTextMessage(event.target, recipient.fromNumber, event.payload.text, [event.payload.location])
    }

    next(undefined, false)
  }
}

export class TwilioClient {
  private config: Config

  constructor(private botId: string, private bp: typeof sdk) {}

  async getConfig(): Promise<Config> {
    if (this.config) {
      return this.config
    }

    const config = (await this.bp.config.getModuleConfigForBot('channel-twilio', this.botId)) as Config
    if (!config) {
      throw new Error(`Could not find channel-twilio.json config file for ${this.botId}.`)
    }

    return config
  }

  async sendTextMessage(senderId: string, recipientId: string, message: string, action?: string | string[]) {
    const config = await this.getConfig()
    const client = twilio(config.accountSID, config.authToken)

    await client.messages
      .create({
        from: recipientId,
        body: message,
        persistentAction: action,
        to: senderId
      })
      // .then(message => this.bp.logger.info('message: ', message))
      .catch(error => this.bp.logger.info('error: ', error))

    debugMessages('outgoing text message', { senderId, message })
  }
}
