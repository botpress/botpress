import Vonage, { ChannelMessage, ChannelType, ChannelWhatsApp, MessageSendError } from '@vonage/server-sdk'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import { ChannelUnsupportedError, Clients, MessageOption, VonageChannelContent, VonageRequestBody } from './typings'

const debug = DEBUG('channel-vonage')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'vonage.sendMessage'

const SUPPORTED_CHANNEL_TYPE: ChannelType = 'whatsapp'
enum ApiBaseUrl {
  TEST = 'https://messages-sandbox.nexmo.com',
  PROD = 'https://api.nexmo.com'
}
const formatKVSKey = (id: string) => `vonage-number-${id}`

export class VonageClient {
  private logger: sdk.Logger
  private vonage: Vonage
  private webhookUrl: string
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
        privateKey: Buffer.from(this.config.privateKey) as any
      },
      {
        debug: this.config.useTestingApi ? true : false,
        apiHost: this.config.useTestingApi ? ApiBaseUrl.TEST : ApiBaseUrl.PROD
      }
    )

    if (this.config.useTestingApi) {
      this.logger.info('Vonage configured to use the testing API!')
    }

    this.logger.info(`Vonage webhooks listening at ${this.webhookUrl}`)
  }

  async handleWebhookRequest(body: VonageRequestBody) {
    debugIncoming('Received message', body)

    // https://developer.nexmo.com/api/messages-olympus?theme=dark
    let payload: sdk.IO.IncomingEvent['payload'] = null
    switch (body.message.content.type) {
      case 'text':
        const text = body.message.content.text
        payload = { type: 'text', text }
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
      const userId = body.from.number
      const botPhoneNumber = body.to.number

      const conversation = await this.conversations.recent(userId)
      await this.kvs.set(formatKVSKey(conversation.id), { botPhoneNumber })

      await this.messages.receive(conversation.id, payload, {
        channel: 'vonage'
      })
    }
  }

  /**
   * Validates Vonage message request body
   * @throws {ChannelUnsupportedError} if the message channel is not 'whatsapp'
   */
  validate(body: VonageRequestBody): void {
    if (body.from.type !== SUPPORTED_CHANNEL_TYPE || body.to.type !== SUPPORTED_CHANNEL_TYPE) {
      throw new ChannelUnsupportedError()
    }
  }

  // Duplicate of modules/builtin/src/content-types/_utils.js
  formatUrl(baseUrl: string, url: string) {
    function isBpUrl(str: string) {
      const re = /^\/api\/.*\/bots\/.*\/media\/.*/

      return re.test(str)
    }

    if (isBpUrl(url)) {
      return `${baseUrl || process.EXTERNAL_URL}${url}`
    } else {
      return url
    }
  }

  renderOutgoingEvent(event: sdk.IO.OutgoingEvent): sdk.IO.Event {
    debugOutgoing('Rendering event', event)

    const payload = event.payload
    const botUrl = payload.BOT_URL

    if (payload.choices) {
      return {
        ...event,
        payload: {
          type: 'quick_reply',
          text: payload.text,
          quick_replies: payload.choices.map(c => ({
            title: c.title,
            payload: c.value.toUpperCase()
          }))
        }
      }
    } else if (payload.items) {
      return {
        ...event,
        payload: {
          type: 'carousel',
          elements: payload.items.map(card => ({
            title: card.title,
            picture: card.image ? this.formatUrl(botUrl, card.image) : null,
            subtitle: card.subtitle,
            buttons: (card.actions || []).map(a => {
              if (a.action === 'Say something') {
                return {
                  type: 'say_something',
                  title: a.title,
                  text: a.text
                }
              } else if (a.action === 'Open URL') {
                return {
                  type: 'open_url',
                  title: a.title,
                  url: a.url && a.url.replace('BOT_URL', botUrl)
                }
              } else if (a.action === 'Postback') {
                return {
                  type: 'postback',
                  title: a.title,
                  payload: a.payload
                }
              } else {
                throw new Error(
                  `Vonage (WhatsApp) carousel does not support "${a.action}" action-buttons at the moment`
                )
              }
            })
          }))
        }
      }
    } else if (payload.image) {
      return {
        ...event,
        payload: {
          type: 'image',
          url: this.formatUrl(botUrl, payload.image),
          caption: payload.title
        }
      }
    } else if (payload.audio) {
      return {
        ...event,
        payload: {
          type: 'audio',
          url: this.formatUrl(botUrl, payload.audio)
        }
      }
    } else if (payload.video) {
      return {
        ...event,
        payload: {
          type: 'video',
          url: this.formatUrl(botUrl, payload.video)
        }
      }
    } else if (event.type === 'text' && payload.text) {
      return {
        ...event,
        payload: {
          type: event.type,
          text: payload.text
        }
      }
    }

    return event
  }

  async handleOutgoingEvent(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const payload = event.payload

    // Note: Vonage Messages API does not support typing indicators for privacy reasons
    if (payload.type === 'quick_reply') {
      await this.sendQuickReply(event, payload.quick_replies)
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

    await this.sendMessage(event, { type: 'text', text })
  }

  async sendMessage(event: sdk.IO.Event, content: VonageChannelContent, whatsapp?: ChannelWhatsApp) {
    const message: ChannelMessage = {
      content,
      whatsapp
    }

    debugOutgoing('Sending message', JSON.stringify(message, null, 2))

    const { botPhoneNumber } = await this.kvs.get(formatKVSKey(event.threadId))

    await new Promise(resolve => {
      this.vonage.channel.send(
        { type: SUPPORTED_CHANNEL_TYPE, number: event.target },
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

    event = client.renderOutgoingEvent(event)
    return client.handleOutgoingEvent(event, next)
  }
}
