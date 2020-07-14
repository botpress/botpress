import * as sdk from 'botpress/sdk'
import LRUCache from 'lru-cache'
import { Twilio, validateRequest } from 'twilio'

import { Config } from '../config'

import { Clients, MessageOption, TwilioRequestBody } from './typings'

const MIDDLEWARE_NAME = 'twilio.sendMessage'

export class TwilioClient {
  private logger: sdk.Logger
  private twilio: Twilio
  private webhookUrl: string
  private kvs: sdk.KvsService

  constructor(
    private bp: typeof sdk,
    private botId: string,
    private config: Config,
    private router: sdk.http.RouterExtension,
    private route: string
  ) {
    this.logger = bp.logger.forBot(botId)
  }

  async initialize() {
    if (!this.config.accountSID || !this.config.authToken) {
      return this.logger.error(`[${this.botId}] The accountSID and authToken must be configured to use this channel.`)
    }

    const url = (await this.router.getPublicPath()) + this.route
    this.webhookUrl = url.replace('BOT_ID', this.botId)

    this.twilio = new Twilio(this.config.accountSID, this.config.authToken)
    this.kvs = this.bp.kvs.forBot(this.botId)

    this.logger.info(`Twilio webhook listening at ${this.webhookUrl}`)
  }

  auth(req): boolean {
    const signature = req.headers['x-twilio-signature']
    return validateRequest(this.config.authToken, signature, this.webhookUrl, req.body)
  }

  getKvsKey(target: string, threadId: string) {
    return `${target}_${threadId}`
  }

  async handleWebhookRequest(body: TwilioRequestBody) {
    const threadId = body.To
    const target = body.From
    const text = body.Body

    const index = Number(text)
    let payload: any = { type: 'text', text: text }
    if (index) {
      payload = (await this.handleIndexReponse(index - 1, target, threadId)) ?? payload
      if (payload.type === 'url') {
        return
      }
    }

    await this.kvs.delete(this.getKvsKey(target, threadId))

    await this.bp.events.sendEvent(
      this.bp.IO.Event({
        botId: this.botId,
        channel: 'twilio',
        direction: 'incoming',
        type: payload.type,
        payload,
        threadId,
        target: target
      })
    )
  }

  async handleIndexReponse(index: number, target: string, threadId: string): Promise<any> {
    const key = this.getKvsKey(target, threadId)
    if (!(await this.kvs.exists(key))) {
      return
    }

    const option = await this.kvs.get(key, `[${index}]`)
    if (!option) {
      return
    }

    await this.kvs.delete(key)

    const { type, label, value } = option
    return {
      type,
      text: type === 'say_something' ? value : label,
      payload: value
    }
  }

  async handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    const { type, payload } = event
    if (type === 'text') {
      await this.sendText(event)
    } else if (type === 'file') {
      await this.sendImage(event)
    } else if (type === 'carousel') {
      await this.sendCarousel(event)
    } else if (payload.quick_replies) {
      await this.sendChoices(event)
    } else if (payload.options) {
      await this.sendDropdown(event)
    }

    next(undefined, false)
  }

  async sendText(event: sdk.IO.Event) {
    await this.sendMessage(event, {
      body: event.payload.text
    })
  }

  async sendImage(event: sdk.IO.Event) {
    await this.sendMessage(event, {
      body: event.payload.title,
      mediaUrl: [event.payload.url]
    })
  }

  async sendCarousel(event: sdk.IO.Event) {
    for (const { subtitle, title, picture, buttons } of event.payload.elements) {
      const body = `${title}\n\n${subtitle ? subtitle : ''}`

      const options: MessageOption[] = []
      for (const { type, title, payload, url, text } of buttons) {
        if (type === 'open_url') {
          options.push({ label: `${title} : ${url}`, value: undefined, type: 'url' })
        } else if (type === 'postback') {
          options.push({ label: title, value: payload, type: 'postback' })
        } else if (type === 'say_something') {
          options.push({ label: title, value: text, type: 'say_something' })
        }
      }

      const args = { mediaUrl: picture ? [picture] : undefined }
      await this.sendOptions(event, body, args, options)
    }
  }

  async sendChoices(event: sdk.IO.Event) {
    const options: MessageOption[] = event.payload.quick_replies.map(x => ({
      label: x.title,
      value: x.payload,
      type: 'quick_reply'
    }))
    await this.sendOptions(event, event.payload.text, {}, options)
  }

  async sendDropdown(event: sdk.IO.Event) {
    const options: MessageOption[] = event.payload.options.map(x => ({
      label: x.label,
      value: x.value,
      type: 'quick_reply'
    }))
    await this.sendOptions(event, event.payload.message, {}, options)
  }

  async sendOptions(event: sdk.IO.Event, text: string, args: any, options: MessageOption[]) {
    const body = `${text}\n\n${options.map(({ label }, idx) => `${idx + 1}. ${label}`).join('\n')}`

    await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')

    await this.sendMessage(event, { ...args, body })
  }

  async sendMessage(event: sdk.IO.Event, args: any) {
    await this.twilio.messages.create({
      ...args,
      provideFeedback: false,
      from: event.threadId,
      to: event.target
    })
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = Twilio.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: MIDDLEWARE_NAME,
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'twilio') {
      return next()
    }

    const client: TwilioClient = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}

export async function removeMiddleware(bp: typeof sdk) {
  bp.events.removeMiddleware(MIDDLEWARE_NAME)
}
