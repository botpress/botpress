import * as sdk from 'botpress/sdk'
import { Twilio, validateRequest } from 'twilio'
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message'

import { Config } from '../config'

import { ChoiceOption, Clients, MessageOption, TwilioContext, TwilioRequestBody } from './typings'

const debug = DEBUG('channel-twilio')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'twilio.sendMessage'

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
    debugIncoming('Received message', body)

    const botPhoneNumber = body.To
    const userId = body.From
    const text = body.Body

    const conversation = await this.bp.experimental.conversations.forBot(this.botId).recent(userId)
    await this.bp.kvs.forBot(this.botId).set(`twilio-number-${conversation.id}`, botPhoneNumber)

    const index = Number(text)
    let payload: any = { type: 'text', text }
    if (index) {
      payload = (await this.handleIndexReponse(index - 1, userId, conversation.id)) ?? payload
      if (payload.type === 'url') {
        return
      }
    }

    await this.kvs.delete(this.getKvsKey(userId, conversation.id))

    await this.bp.experimental.messages.forBot(this.botId).receive(conversation.id, payload, { channel: 'twilio' })
  }

  async handleIndexReponse(index: number, userId: string, conversationId: string): Promise<any> {
    const key = this.getKvsKey(userId, conversationId)
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

  async handleOutgoingEvent(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const payload = event.payload

    const renderers = this.bp.experimental.render.getChannelRenderers('twilio')
    const context: TwilioContext = {
      bp: this.bp,
      event,
      client: this.twilio,
      args: { sendMessage: this.sendMessage.bind(this) }
    }
    let handled = false
    for (const renderer of renderers) {
      if (!(await renderer.handles(context))) {
        continue
      }

      handled = await renderer.render(context)

      if (handled) {
        break
      }
    }

    if (handled) {
    } else if (payload.quick_replies) {
      await this.sendChoices(event, payload.quick_replies)
    } else if (payload.options) {
      await this.sendOptions(
        event,
        event.payload.message,
        {},
        event.payload.options.map(x => ({ ...x, type: 'quick_reply' }))
      )
    } else if (payload.type === 'carousel') {
      await this.sendCarousel(event, payload)
    }

    await this.bp.experimental.messages
      .forBot(this.botId)
      .create(event.threadId, payload, undefined, event.id, event.incomingEventId)

    next(undefined, false)
  }

  async sendChoices(event: sdk.IO.Event, choices: ChoiceOption[]) {
    const options: MessageOption[] = choices.map(x => ({
      label: x.title,
      value: x.payload,
      type: 'quick_reply'
    }))
    await this.sendOptions(event, event.payload.text, {}, options)
  }

  async sendCarousel(event: sdk.IO.Event, payload: any) {
    for (const { subtitle, title, picture, buttons } of payload.elements) {
      const body = `${title}\n\n${subtitle ? subtitle : ''}`

      const options: MessageOption[] = []
      for (const button of buttons || []) {
        const title = button.title as string

        if (button.type === 'open_url') {
          options.push({ label: `${title} : ${button.url}`, value: undefined, type: 'url' })
        } else if (button.type === 'postback') {
          options.push({ label: title, value: button.payload, type: 'postback' })
        } else if (button.type === 'say_something') {
          options.push({ label: title, value: button.text as string, type: 'say_something' })
        }
      }

      const args = { mediaUrl: picture ? picture : undefined }
      await this.sendOptions(event, body, args, options)
    }
  }

  async sendOptions(event: sdk.IO.Event, text: string, args: any, options: MessageOption[]) {
    let body = text
    if (options.length) {
      body = `${text}\n\n${options.map(({ label }, idx) => `${idx + 1}. ${label}`).join('\n')}`
    }

    await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')

    await this.sendMessage(event, { ...args, body })
  }

  async sendMessage(event: sdk.IO.Event, args: any) {
    const botPhoneNumber = await this.bp.kvs.forBot(this.botId).get(`twilio-number-${event.threadId}`)

    const message: MessageInstance = {
      ...args,
      provideFeedback: false,
      from: botPhoneNumber,
      to: event.target
    }

    debugOutgoing('Sending message', message)

    await this.twilio.messages.create(message)
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
