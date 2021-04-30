import Vonage, { ChannelMessage, ChannelType, ChannelWhatsApp } from '@vonage/server-sdk'
import * as sdk from 'botpress/sdk'
import { StandardError, UnauthorizedError } from 'common/http'
import crypto from 'crypto'
import { Request } from 'express'
import jwt from 'jsonwebtoken'
import path from 'path'

import { Config } from '../config'

import {
  Clients,
  ExtendedChannelContent,
  MessageApiError,
  MessageOption,
  SignedJWTPayload,
  VonageChannelContent,
  VonageRequestBody
} from './typings'

const debug = DEBUG('channel-vonage')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'vonage.sendMessage'

const CHANNEL_NAME = 'vonage'
const SUPPORTED_CHANNEL_TYPE: ChannelType = 'whatsapp'
enum ApiBaseUrl {
  TEST = 'https://messages-sandbox.nexmo.com',
  PROD = 'https://api.nexmo.com'
}

const isInt = (str: string) => !isNaN(parseInt(str, 10))
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
    let payload: sdk.IO.IncomingEvent['payload'] = null
    switch (messageContent.type) {
      case 'text':
        const text = messageContent.text
        payload = { type: 'text', text }

        // Since single choice and carousel are down rendered, we have to handle option selection differently
        payload = (await this.handleOptionResponse(text, userId, conversation.id)) ?? payload
        break
      case 'audio':
        payload = {
          type: 'voice',
          url: messageContent.audio.url
        }
        break
      case 'image':
        payload = {
          type: 'file', // TODO: Change image content-type type to 'image' instead of 'file'
          title: messageContent.image.caption,
          url: messageContent.image.url,
          collectFeedback: false
        }
        break
      case 'video':
        payload = {
          type: messageContent.type,
          title: `${path.basename(messageContent.video.url)}.mp4`, // TODO: Take for granted that video file will be .mp4 files?
          url: messageContent.video.url,
          collectFeedback: false
        }
        break
      case 'file':
        payload = {
          type: 'document',
          title: messageContent.file.caption,
          url: messageContent.file.url,
          collectFeedback: false
        }
        break
      case 'location':
        payload = {
          type: messageContent.type,
          latitude: messageContent.location.lat,
          longitude: messageContent.location.long,
          collectFeedback: false
        }
        break
      default:
        payload = undefined
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

  /**
   * This function allows to handle index responses when using down rendering with single choice and carousel
   */
  private async handleOptionResponse(text: string, userId: string, conversationId: string): Promise<any> {
    const key = this.getKvsKey(userId, conversationId)

    if (isInt(text)) {
      if (!(await this.kvs.exists(key))) {
        return
      }

      const index = parseInt(text, 10) - 1
      const option = await this.kvs.get(key, `[${index}]`)
      if (!option) {
        return
      }

      const { type, label, value } = option
      if (type === 'url') {
        return
      } else {
        return {
          type,
          text: type === 'say_something' ? value : label,
          payload: value
        }
      }
    }

    await this.kvs.delete(key)
  }

  /**
   * Validates Vonage message request body
   * @throws {StandardError} if the message channel is not 'whatsapp'
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
    const payload = event.payload

    if (payload.type === 'typing') {
      // Note: Vonage Messages API does not support typing indicators for privacy reasons
      await Promise.delay(1000)
    } else if (payload.quick_replies) {
      await this.sendQuickReply(event, payload.quick_replies)
    } else if (payload.options) {
      await this.sendDropdown(event, payload.options)
    } else if (payload.type === 'carousel') {
      await this.sendCarousel(event, payload)
    } else if (payload.type === 'file') {
      // We receive payloads of type file but want to send images
      // FIXME: When we decide to switch to channel renderers
      payload.type = 'image'
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

  private async sendImage(event: sdk.IO.OutgoingEvent, payload: any) {
    await this.sendMessage(event, {
      type: payload.type,
      text: undefined,
      image: {
        url: payload.url,
        caption: payload.caption
      }
    })
  }

  private async sendAudio(event: sdk.IO.OutgoingEvent, payload: any) {
    await this.sendMessage(event, {
      type: payload.type,
      text: undefined,
      audio: {
        url: payload.url
      }
    })
  }

  private async sendVideo(event: sdk.IO.OutgoingEvent, payload: any) {
    await this.sendMessage(event, {
      type: payload.type,
      text: undefined,
      video: {
        url: payload.url
      }
    })
  }

  private async sendQuickReply(event: sdk.IO.OutgoingEvent, choices: any) {
    const options: MessageOption[] = choices.map(x => ({
      label: x.title,
      value: x.payload,
      type: 'quick_reply'
    }))

    await this.sendOptions(event, event.payload.text, options)
  }

  private async sendDropdown(event: sdk.IO.OutgoingEvent, choices: any) {
    const options: MessageOption[] = choices.map(x => ({
      ...x,
      type: 'quick_reply'
    }))

    await this.sendOptions(event, event.payload.message, options)
  }

  private async sendCarousel(event: sdk.IO.Event, payload: any) {
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

  // TODO: add support for WhatsApp Templates instead of using down rendering
  private async sendOptions(event: sdk.IO.Event, text: string, options: MessageOption[]) {
    if (options.length) {
      text = `${text}\n\n${options.map(({ label }, idx) => `*(${idx + 1})* ${label}`).join('\n')}`
    }

    await this.kvs.set(this.getKvsKey(event.target, event.threadId), options, undefined, '10m')

    await this.sendMessage(event, { type: 'text', text })
  }

  private async sendMessage(event: sdk.IO.Event, content: VonageChannelContent, whatsapp?: ChannelWhatsApp) {
    const message: ChannelMessage = {
      content,
      whatsapp
    }

    debugOutgoing('Sending message', JSON.stringify(message, null, 2))

    await new Promise(resolve => {
      this.vonage.channel.send(
        { type: SUPPORTED_CHANNEL_TYPE, number: event.target },
        {
          type: SUPPORTED_CHANNEL_TYPE,
          number: this.config.botPhoneNumber
        },
        message,
        (err, data) => {
          if (err) {
            // fixes typings
            const errBody: MessageApiError = (err as any).body
            let reasons: string = ''
            if (errBody) {
              if (errBody.invalid_parameters) {
                for (const param of errBody.invalid_parameters) {
                  reasons += `${param.reason}: ${param.name}; `
                }
              }

              this.logger.error(`${errBody.title}: ${errBody.detail} ${reasons}${errBody.type}`)
            } else if ((<any>err).statusCode === '429') {
              this.logger.error('HTTPError (429): Too Many Requests')
            } else {
              this.logger.error('UnknownError', err)
            }
          } else {
            resolve(data)
          }
        }
      )
    })

    // Sandbox API is limited to one call per second. Wait one second between calls.
    if (this.config.useTestingApi) {
      await Promise.delay(1000)
    }
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
    if (event.channel !== CHANNEL_NAME) {
      return next()
    }

    const client: VonageClient = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}
