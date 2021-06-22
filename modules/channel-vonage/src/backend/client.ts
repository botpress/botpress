import Vonage, { ChannelType } from '@vonage/server-sdk'
import * as sdk from 'botpress/sdk'
import { ChannelRenderer, ChannelSender } from 'common/channel'
import { StandardError, UnauthorizedError } from 'common/http'
import crypto from 'crypto'
import { Request } from 'express'
import jwt from 'jsonwebtoken'
import _ from 'lodash'

import { Config } from '../config'

import {
  VonageTextRenderer,
  VonageImageRenderer,
  VonageCarouselRenderer,
  VonageCardRenderer,
  VonageChoicesRenderer,
  VonageVideoRenderer,
  VonageAudioRenderer,
  VonageMediaTemplateRenderer,
  VonageLocationRenderer,
  VonageTemplateRenderer,
  VonageDropdownRenderer,
  VonageFileRenderer
} from '../renderers'
import { VonageCommonSender, VonageTypingSender } from '../senders'

import { Clients, ExtendedChannelContent, SignedJWTPayload, VonageContext, VonageRequestBody } from './typings'

const debug = DEBUG('channel-vonage')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'vonage.sendMessage'

export const CHANNEL_NAME = 'vonage'
const SUPPORTED_CHANNEL_TYPE: ChannelType = 'whatsapp'
enum ApiBaseUrl {
  TEST = 'https://messages-sandbox.nexmo.com',
  PROD = 'https://api.nexmo.com'
}
const sha256 = (str: string) =>
  crypto
    .createHash('sha256')
    .update(str)
    .digest('hex')

export class VonageClient {
  private logger: sdk.Logger
  private vonage: Vonage
  private conversations: sdk.experimental.conversations.BotConversations
  private messages: sdk.experimental.messages.BotMessages
  private kvs: sdk.KvsService
  private renderers: ChannelRenderer<VonageContext>[]
  private senders: ChannelSender<VonageContext>[]

  constructor(
    private bp: typeof sdk,
    private botId: string,
    private config: Config,
    private router: sdk.http.RouterExtension,
    private baseRoute: string
  ) {
    this.logger = bp.logger.forBot(botId)
    this.conversations = this.bp.experimental.conversations.forBot(this.botId)
    this.messages = this.bp.experimental.messages.forBot(this.botId)
    this.kvs = this.bp.kvs.forBot(this.botId)
  }

  async initialize() {
    if (
      !this.config.apiKey ||
      !this.config.apiSecret ||
      !this.config.applicationId ||
      !this.config.privateKey ||
      !this.config.signatureSecret
    ) {
      return this.logger.error(
        `[${this.botId}] The apiKey, apiSecret, applicationId, privateKey and signatureSecret must be configured in order to use this channel.`
      )
    }

    const url = (await this.router.getPublicPath()) + this.baseRoute
    const webhookUrl = url.replace('BOT_ID', this.botId)

    // Doc: https://developer.nexmo.com/messages/concepts/messages-api-sandbox
    this.vonage = new Vonage(
      {
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        applicationId: this.config.applicationId,
        privateKey: <any>Buffer.from(this.config.privateKey), // Vonage typings require that the privateKey be a string even though the code supports Buffers.
        signatureSecret: this.config.signatureSecret
      },
      {
        apiHost: this.config.useTestingApi ? ApiBaseUrl.TEST : ApiBaseUrl.PROD
      }
    )

    if (this.config.useTestingApi) {
      this.logger.info('Vonage configured to use the testing API!')
      this.logger.warn('Please keep in mind that the sandbox is limited to one call per second.')
    }

    this.logger.info(`Vonage inbound webhooks listening at ${webhookUrl}/inbound`)
    this.logger.info(`Vonage status webhooks listening at ${webhookUrl}/status`)

    this.renderers = [
      new VonageCardRenderer(),
      new VonageDropdownRenderer(),
      new VonageTextRenderer(),
      new VonageImageRenderer(),
      new VonageLocationRenderer(),
      new VonageCarouselRenderer(),
      new VonageAudioRenderer(),
      new VonageVideoRenderer(),
      new VonageTemplateRenderer(),
      new VonageMediaTemplateRenderer(),
      new VonageFileRenderer(),
      new VonageChoicesRenderer()
    ]

    this.senders = [new VonageTypingSender(), new VonageCommonSender()]
  }

  async handleWebhookRequest(body: VonageRequestBody) {
    debugIncoming('Received message', body)

    const userId = body.from.number
    const botPhoneNumber = body.to.number

    if (this.config.botPhoneNumber !== botPhoneNumber) {
      debugIncoming(
        `Config bot phone number differ from the one received: ${this.config.botPhoneNumber} !== ${botPhoneNumber}. Ignoring the request...`
      )
      return
    }

    const conversation = await this.conversations.recent(userId)

    const messageContent = <ExtendedChannelContent>body.message.content

    // https://developer.nexmo.com/api/messages-olympus?theme=dark
    let payload: unknown = null
    switch (messageContent.type) {
      case 'text':
        payload = this.bp.experimental.render.text(messageContent.text)
        break
      case 'button':
        payload = this.bp.experimental.render.text(messageContent.button.text)
        break
      case 'image':
        payload = this.bp.experimental.render.image(messageContent.image.url, messageContent.image.caption)
        break
      case 'audio':
        // We have to take for granted that all messages of type audio are voice messages
        // since Vonage does not differentiate the two.
        payload = {
          type: 'voice',
          audio: messageContent.audio.url
        }
        break
      case 'video':
        payload = this.bp.experimental.render.video(messageContent.video.url, messageContent.video.caption)
        break
      case 'file':
        payload = {
          type: messageContent.type,
          title: messageContent.file.caption,
          file: messageContent.file.url
        }
        break
      case 'location':
        payload = this.bp.experimental.render.location(messageContent.location.lat, messageContent.location.long)
        break
      default:
        break
    }

    if (payload) {
      await this.messages.receive(conversation.id, payload, {
        channel: CHANNEL_NAME
      })
    }
  }

  private getKvsKey(target: string, threadId: string) {
    return `${target}_${threadId}`
  }

  public async handleIndexReponse(
    index: number,
    userId: string,
    conversationId: string
  ): Promise<undefined | sdk.TextContent> {
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
    return this.bp.experimental.render.text(value)
  }

  async prepareIndexResponse(event: sdk.IO.OutgoingEvent, options: sdk.ChoiceOption[]) {
    await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')
  }

  /**
   * Validates Vonage message request body
   * @throws {StandardError} if the message channel is not 'WhatsApp'
   * @throws {UnauthorizedError} if scheme isn't 'Bearer' or if the token is missing or invalid
   */
  validate(req: Request): void {
    const body: VonageRequestBody = req.body
    if (body.from.type !== SUPPORTED_CHANNEL_TYPE || body.to.type !== SUPPORTED_CHANNEL_TYPE) {
      throw new StandardError('Unable to process message', 'only Whatsapp channel is supported')
    }

    const [scheme, token] = req.headers.authorization.split(' ')
    if (scheme.toLowerCase() !== 'bearer') {
      throw new UnauthorizedError(`Unknown scheme "${scheme}"`)
    }
    if (!token) {
      throw new UnauthorizedError('Authentication token is missing')
    }

    try {
      // Doc: https://developer.nexmo.com/messages/concepts/signed-webhooks
      const decoded = <SignedJWTPayload>jwt.verify(token, this.config.signatureSecret, { algorithms: ['HS256'] })

      if (
        !(typeof decoded === 'object') ||
        decoded.api_key !== this.config.apiKey ||
        sha256(JSON.stringify(body)) !== decoded.payload_hash
      ) {
        throw new Error()
      }
    } catch (err) {
      throw new UnauthorizedError('Authentication token is invalid')
    }
  }

  async handleOutgoingEvent(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const context: VonageContext = {
      bp: this.bp,
      event,
      client: this.vonage,
      handlers: [],
      payload: _.cloneDeep(event.payload),
      botUrl: process.EXTERNAL_URL,
      messages: [],
      botPhoneNumber: this.config.botPhoneNumber,
      prepareIndexResponse: this.prepareIndexResponse.bind(this),
      isSandbox: this.config.useTestingApi,
      debug: debugOutgoing,
      logger: this.logger
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

    next(undefined, false, false)
  }

  async handleIncomingEvent(event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const index = Number(event.payload.text)
    if (!index) {
      return
    }

    const mappedPayload = (await this.handleIndexReponse(index - 1, event.target, event.threadId)) ?? event.payload
    if (!mappedPayload.text) {
      next(undefined, true, false)
    }

    ;(<any>event).payload = { ...event.payload, ...mappedPayload }
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = Vonage.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: MIDDLEWARE_NAME,
    order: 100
  })

  bp.events.registerMiddleware({
    description: 'Translate index responses to their corresponding payloads',
    direction: 'incoming',
    handler: incomingHandler,
    name: 'vonage.indexResponse',
    order: 0
  })

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== CHANNEL_NAME) {
      return next(undefined, false, true)
    }

    const client: VonageClient = clients[event.botId]
    if (!client) {
      return next(undefined, false, true)
    }

    return client.handleOutgoingEvent(event, next)
  }

  async function incomingHandler(event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== CHANNEL_NAME) {
      return next(undefined, false, true)
    }

    const client: VonageClient = clients[event.botId]
    if (!client) {
      return next(undefined, false, true)
    }

    return client.handleIncomingEvent(event, next)
  }
}
