import Vonage, { ChannelMessage, ChannelType, ChannelWhatsApp, MessageSendError } from '@vonage/server-sdk'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import { Request } from 'express'
import jwt from 'jsonwebtoken'
import { Cancelable, throttle } from 'lodash'

import { Config } from '../config'

import {
  ChannelUnsupportedError,
  Clients,
  MessageOption,
  UnauthorizedError,
  VonageChannelContent,
  VonageRequestBody
} from './typings'

const debug = DEBUG('channel-vonage')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'vonage.sendMessage'

const SUPPORTED_CHANNEL_TYPE: ChannelType = 'whatsapp'
enum ApiBaseUrl {
  TEST = 'https://messages-sandbox.nexmo.com',
  PROD = 'https://api.nexmo.com'
}

export class VonageClient {
  private logger: sdk.Logger
  private vonage: Vonage
  private webhookUrl: string
  private conversations: sdk.experimental.conversations.BotConversations
  private messages: sdk.experimental.messages.BotMessages
  private kvs: sdk.KvsService
  private throttledSend: ((userId: string, botPhoneNumber: string, message: ChannelMessage) => Promise<void>) &
    Cancelable

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
    if (!this.config.apiKey || !this.config.apiSecret || !this.config.applicationId || !this.config.privateKey) {
      return this.logger.error(
        `[${this.botId}] The apiKey, apiSecret, applicationId and privateKey must be configured in order to use this channel.`
      )
    }

    const url = (await this.router.getPublicPath()) + this.baseRoute
    this.webhookUrl = url.replace('BOT_ID', this.botId)

    // Doc: https://developer.nexmo.com/messages/concepts/messages-api-sandbox
    this.vonage = new Vonage(
      {
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        applicationId: this.config.applicationId,
        privateKey: Buffer.from(this.config.privateKey) as any,
        signatureSecret: this.config.signatureSecret
      },
      {
        debug: this.config.useTestingApi ? true : false,
        apiHost: this.config.useTestingApi ? ApiBaseUrl.TEST : ApiBaseUrl.PROD
      }
    )

    this.throttledSend = throttle(
      async (userId: string, botPhoneNumber: string, message: any) => {
        await new Promise(resolve => {
          this.vonage.channel.send(
            { type: SUPPORTED_CHANNEL_TYPE, number: userId },
            {
              type: SUPPORTED_CHANNEL_TYPE,
              number: botPhoneNumber
            },
            message,
            (err, data) => {
              if (err) {
                // fixes typings
                err = (err as any).body as MessageSendError
                console.error(err)
              } else {
                resolve(data)
              }
            }
          )
        })
      },
      // Sandbox is limited to one call per second: https://developer.nexmo.com/messages/concepts/messages-api-sandbox#rate-limit
      this.config.useTestingApi ? 1000 : 0,
      { leading: true, trailing: false }
    )

    if (this.config.useTestingApi) {
      this.logger.info('Vonage configured to use the testing API!')
    }

    this.logger.info(`Vonage inbound webhooks listening at ${this.webhookUrl}/inbound`)
    this.logger.info(`Vonage status webhooks listening at ${this.webhookUrl}/status`)
  }

  async handleWebhookRequest(body: VonageRequestBody) {
    debugIncoming('Received message', body)

    const userId = body.from.number
    const botPhoneNumber = body.to.number

    const conversation = await this.conversations.recent(userId)
    await this.kvs.set(`vonage-number-${conversation.id}`, { botPhoneNumber })

    // https://developer.nexmo.com/api/messages-olympus?theme=dark
    let payload: sdk.IO.IncomingEvent['payload'] = null
    switch (body.message.content.type) {
      case 'text':
        const text = body.message.content.text
        payload = { type: 'text', text }

        const index = Number(text)
        if (index) {
          payload = (await this.handleIndexResponse(index - 1, userId, conversation.id)) ?? payload

          if (payload.type === 'url') {
            return
          }
        }

        await this.kvs.delete(this.getKvsKey(userId, conversation.id))
        break
      case 'audio':
        const audio = body.message.content.audio.url
        payload = { type: 'voice', audio }
        break
      default:
        payload = {}
        break
    }

    if (payload) {
      await this.messages.receive(conversation.id, payload, {
        channel: 'vonage'
      })
    }
  }

  getKvsKey(target: string, threadId: string) {
    return `${target}_${threadId}`
  }

  async handleIndexResponse(index: number, userId: string, conversationId: string): Promise<any> {
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

  /**
   * Validates Vonage message request body
   * @throws {ChannelUnsupportedError} if the message channel is not 'whatsapp'
   * @throws {UnauthorizedError} if schema isn't 'Bearer' or if the token is missing or invalid
   */
  validate(req: Request): void {
    const body: VonageRequestBody = req.body
    if (body.from.type !== SUPPORTED_CHANNEL_TYPE || body.to.type !== SUPPORTED_CHANNEL_TYPE) {
      throw new ChannelUnsupportedError()
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
      const decoded = jwt.verify(token, Buffer.from(this.config.signatureSecret), { algorithms: ['HS256'] })
      const sha256 = (str: string) =>
        crypto
          .createHash('sha256')
          .update(str)
          .digest('hex')

      if (
        !(typeof decoded === 'object') ||
        decoded['api_key'] !== this.config.apiKey ||
        sha256(JSON.stringify(body)) !== decoded['payload_hash']
      ) {
        throw new Error()
      }
    } catch (err) {
      throw new UnauthorizedError('Authentication token is invalid')
    }
  }

  // Duplicate of modules/builtin/src/content-types/_utils.js
  formatUrl(baseUrl: string, url: string) {
    function isBpUrl(str: string) {
      const re = /^\/api\/.*\/bots\/.*\/media\/.*/

      return re.test(str)
    }

    if (isBpUrl(url)) {
      return `${baseUrl}${url}`
    } else {
      return url
    }
  }

  async handleOutgoingEvent(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const payload = event.payload

    // Note: Vonage Messages API does not support typing indicators for privacy reasons
    if (payload.quick_replies) {
      await this.sendQuickReply(event, payload.quick_replies)
    } else if (payload.options) {
      await this.sendDropdown(event, payload.options)
    } else if (payload.type === 'carousel') {
      await this.sendCarousel(event, payload)
    } else if (payload.type === 'image') {
      await this.sendImage(event, payload)
    } else if (payload.type === 'audio') {
      await this.sendAudio(event, payload)
    } else if (payload.type === 'video') {
      await this.sendVideo(event, payload)
    } else if (payload.type === 'text') {
      await this.sendMessage(event, {
        type: payload.type,
        text: payload.text
      })
    }

    next(undefined, false)
  }

  async sendImage(event: sdk.IO.OutgoingEvent, payload: any) {
    await this.sendMessage(event, {
      type: payload.type,
      text: undefined,
      image: {
        url: payload.url,
        caption: payload.caption
      }
    })
  }

  async sendAudio(event: sdk.IO.OutgoingEvent, payload: any) {
    await this.sendMessage(event, {
      type: payload.type,
      text: undefined,
      audio: {
        url: payload.url
      }
    })
  }

  async sendVideo(event: sdk.IO.OutgoingEvent, payload: any) {
    await this.sendMessage(event, {
      type: payload.type,
      text: undefined,
      video: {
        url: payload.url
      }
    })
  }

  async sendQuickReply(event: sdk.IO.OutgoingEvent, choices: any) {
    const options: MessageOption[] = choices.map(x => ({
      label: x.title,
      value: x.payload,
      type: 'quick_reply'
    }))

    await this.sendOptions(event, event.payload.text, options)
  }

  async sendDropdown(event: sdk.IO.OutgoingEvent, choices: any) {
    const options: MessageOption[] = choices.map(x => ({
      ...x,
      type: 'quick_reply'
    }))

    await this.sendOptions(event, event.payload.message, options)
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

      if (picture) {
        await this.sendImage(event, { url: picture, type: 'image' })
      }

      await this.sendOptions(event, body, options)
    }
  }

  async sendOptions(event: sdk.IO.Event, text: string, options: MessageOption[]) {
    if (options.length) {
      text = `${text}\n\n${options.map(({ label }, idx) => `${idx + 1}. ${label}`).join('\n')}`
    }

    await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')

    await this.sendMessage(event, { type: 'text', text })
  }

  async sendMessage(event: sdk.IO.Event, content: VonageChannelContent, whatsapp?: ChannelWhatsApp) {
    const message: ChannelMessage = {
      content,
      whatsapp
    }

    debugOutgoing('Sending message', JSON.stringify(message, null, 2))

    const { botPhoneNumber } = await this.kvs.get(`vonage-number-${event.threadId}`)

    await this.throttledSend(event.target, botPhoneNumber, message)
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

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'vonage') {
      return next()
    }

    const client: VonageClient = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}
