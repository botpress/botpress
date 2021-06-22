import * as sdk from 'botpress/sdk'
import { ChannelRenderer, ChannelSender } from 'common/channel'
import _ from 'lodash'
import { Twilio, validateRequest } from 'twilio'
import { Config } from '../config'
import {
  TwilioCardRenderer,
  TwilioCarouselRenderer,
  TwilioChoicesRenderer,
  TwilioDropdownRenderer,
  TwilioImageRenderer,
  TwilioTextRenderer
} from '../renderers'
import { TwilioCommonSender } from '../senders'
import { CHANNEL_NAME } from './constants'
import { Clients, MessageOption, TwilioContext, TwilioRequestBody } from './typings'

const debug = DEBUG('channel-twilio')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'twilio.sendMessage'

export class TwilioClient {
  private logger: sdk.Logger
  private twilio: Twilio
  private webhookUrl: string
  private kvs: sdk.KvsService
  private renderers: ChannelRenderer<TwilioContext>[]
  private senders: ChannelSender<TwilioContext>[]

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

    this.renderers = [
      new TwilioCardRenderer(),
      new TwilioDropdownRenderer(),
      new TwilioTextRenderer(),
      new TwilioImageRenderer(),
      new TwilioCarouselRenderer(),
      new TwilioChoicesRenderer()
    ]

    this.senders = [new TwilioCommonSender()]
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

    const conversation = await this.bp.experimental.conversations.forBot(this.botId).recent(userId)
    await this.bp.kvs.forBot(this.botId).set(`twilio-number-${conversation.id}`, botPhoneNumber)

    const text = body.Body
    const index = Number(text)
    let payload: any = this.bp.experimental.render.text(text)

    if (index) {
      payload = (await this.handleIndexReponse(index - 1, userId, conversation.id)) ?? payload
      if (!payload.text) {
        return
      }
    } else if (body.MediaUrl0) {
      payload = this.bp.experimental.render.image(body.MediaUrl0, text)
    }

    await this.kvs.delete(this.getKvsKey(userId, conversation.id))

    await this.bp.experimental.messages.forBot(this.botId).receive(conversation.id, payload, { channel: CHANNEL_NAME })
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

    const { value } = option
    return {
      type: 'text',
      text: value
    }
  }

  async prepareIndexResponse(event: sdk.IO.OutgoingEvent, options: MessageOption[]) {
    await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')
  }

  async handleOutgoingEvent(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const botPhoneNumber = await this.bp.kvs.forBot(this.botId).get(`twilio-number-${event.threadId}`)

    const context: TwilioContext = {
      bp: this.bp,
      event,
      client: this.twilio,
      handlers: [],
      payload: _.cloneDeep(event.payload),
      botUrl: process.EXTERNAL_URL,
      messages: [],
      botPhoneNumber,
      prepareIndexResponse: this.prepareIndexResponse.bind(this)
    }

    for (const renderer of this.renderers) {
      if (renderer.handles(context)) {
        renderer.render(context)
        context.handlers.push(renderer.id)
      }
    }

    for (const sender of this.senders) {
      if (sender.handles(context)) {
        await sender.send(context)
      }
    }

    await this.bp.experimental.messages
      .forBot(this.botId)
      .create(event.threadId, event.payload, undefined, event.id, event.incomingEventId)

    next(undefined, false)
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
    if (event.channel !== CHANNEL_NAME) {
      return next()
    }

    const client: TwilioClient = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}
