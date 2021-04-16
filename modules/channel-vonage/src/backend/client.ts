import Vonage, { ChannelMessage, ChannelType, ChannelWhatsApp, MessageSendError } from '@vonage/server-sdk'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'
import { Buttons, Components, TemplateComponents } from './template'

import {
  ChannelContentCustomTemplate,
  ChannelUnsupportedError,
  Clients,
  TemplateLanguage,
  VonageChannelContent,
  VonageMessageStatusBody,
  VonageRequestBody
} from './typings'

const debug = DEBUG('channel-vonage')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'vonage.sendMessage'

// TODO: Remove this. For testing purpose only
const TESTING_TEMPLATE_NAMESPACE = '9b6b4fcb_da19_4a26_8fe8_78074a91b584'
const TESTING_QUICK_REPLY_TEMPLATE_NAME = 'sandbox_doctors_appointment'
const TESTING_LINK_BUTTON_TEMPLATE_NAME = 'sandbox_travel_boardingpass'

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

    // TODO: Handle other types of payload
    // https://developer.nexmo.com/api/messages-olympus?theme=dark
    const text = body.message.content.text
    const userId = body.from.number
    const botPhoneNumber = body.to.number

    const payload: sdk.IO.IncomingEvent['payload'] = { type: 'text', text }

    const conversation = await this.conversations.recent(userId)
    await this.kvs.set(formatKVSKey(conversation.id), { botPhoneNumber })

    await this.messages.receive(conversation.id, payload, {
      channel: 'vonage'
    })
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

  // TODO: Remove this. For testing purpose only
  async handleIncomingMessageStatus(body: VonageMessageStatusBody) {
    debugIncoming('Received message status', body)
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

  renderOutgoingEvent(event: sdk.IO.OutgoingEvent): sdk.IO.Event {
    debugOutgoing('Rendering event', event)

    const botUrl = event.payload.BOT_URL

    if (event.type === 'text') {
      return {
        ...event,
        payload: {
          type: event.type,
          text: event.payload.text
        }
      }
    } else if (event.type === 'image') {
      return {
        ...event,
        payload: {
          type: event.type,
          url: this.formatUrl(botUrl, event.payload.image),
          caption: event.payload.title
        }
      }
    } else if (event.type === 'audio') {
      return {
        ...event,
        payload: {
          type: event.type,
          url: this.formatUrl(botUrl, event.payload.audio)
        }
      }
    } else if (event.type === 'video') {
      return {
        ...event,
        payload: {
          type: event.type,
          url: this.formatUrl(botUrl, event.payload.video)
        }
      }
    } else if (event.type === 'quick_reply') {
      return {
        ...event,
        payload: {
          type: event.type,
          text: event.payload.text,
          choices: event.payload.choices.map(btn => ({
            ...btn,
            url: btn.url && this.formatUrl(botUrl, btn.url)
          }))
        }
      }
    } else if (event.type === 'link_button') {
      const card = event.payload.items[0]

      return {
        ...event,
        payload: {
          type: event.type,
          text: card.title,
          subtitle: card.subtitle,
          image: this.formatUrl(botUrl, card.image),
          actions: card.actions.map(btn => ({ ...btn, url: this.formatUrl(botUrl, btn.url) }))
        }
      }
    }

    return event
  }

  async handleOutgoingEvent(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    const payload = event.payload

    // Note: Vonage Messages API does not support typing indicators for privacy reasons
    if (payload.type === 'text') {
      await this.sendMessage(event, {
        type: payload.type,
        text: payload.text
      })
    } else if (payload.type === 'image') {
      await this.sendMessage(event, {
        type: payload.type,
        text: undefined,
        image: {
          url: payload.url,
          caption: payload.caption
        }
      })
    } else if (payload.type === 'audio') {
      await this.sendMessage(event, {
        type: payload.type,
        text: undefined,
        audio: {
          url: payload.url
        }
      })
    } else if (payload.type === 'video') {
      await this.sendMessage(event, {
        type: payload.type,
        text: undefined,
        video: {
          url: payload.url
        }
      })
    } else if (payload.type === 'quick_reply') {
      await this.sendQuickReply(event, payload)
    } else if (payload.type === 'link_button') {
      await this.sendLinkButton(event, payload)
    }
    next(undefined, false)
  }

  async sendQuickReply(event: sdk.IO.OutgoingEvent, payload: any) {
    const language: TemplateLanguage = {
      code: 'en_US',
      policy: 'deterministic'
    }

    let components: Components
    if (this.config.useTestingApi) {
      components = new TemplateComponents()
        .withBody(
          { type: 'text', text: 'Joe Bob' },
          { type: 'text', text: 'something' },
          { type: 'text', text: '*Shlack Valley Ski Resort*' },
          { type: 'text', text: '12 PM' }
        )
        .build()
    } else {
      const buttons: Buttons = payload.choices.map(btn => {
        if (btn.action === 'Say something' || btn.action === 'Postback') {
          return {
            subType: 'quick_reply',
            parameters: [{ type: 'payload', payload: btn.payload }]
          }
        } else if (btn.action === 'Open URL') {
          return {
            subType: 'quick_reply',
            parameters: [{ type: 'url', payload: btn.url }]
          }
        } else {
          throw new Error(`Vonage (WhatsApp) carousel does not support "${btn.action}" action-buttons at the moment`)
        }
      })

      components = new TemplateComponents()
        .withHeader({ type: 'text', text: payload.text })
        .withBody({
          type: 'text',
          text: payload.subtitle
        })
        .withButtons(...buttons)
        .build()
    }

    const custom: ChannelContentCustomTemplate = {
      type: 'template',
      template: {
        namespace: this.config.useTestingApi ? TESTING_TEMPLATE_NAMESPACE : payload.namespace,
        name: this.config.useTestingApi ? TESTING_QUICK_REPLY_TEMPLATE_NAME : payload.name,
        language,
        components
      }
    }

    await this.sendMessage(event, {
      type: 'custom',
      text: undefined,
      custom
    })
  }

  async sendLinkButton(event: sdk.IO.OutgoingEvent, payload: any) {
    const language: TemplateLanguage = {
      code: 'en_US',
      policy: 'deterministic'
    }

    let components: Components
    if (this.config.useTestingApi) {
      components = new TemplateComponents()
        .withHeader({
          type: 'image',
          image: {
            link: 'https://publicdomainvectors.org/photos/Placeholder.png'
          }
        })
        .withBody(
          { type: 'text', text: 'Joe Bob' },
          { type: 'text', text: 'somewhere' },
          { type: 'text', text: '123-4' },
          { type: 'text', text: '12 PM' }
        )
        .build()
    } else {
      const buttons: Buttons = (payload.actions || []).map(btn => {
        if (btn.action === 'Open URL') {
          return {
            subtype: 'url',
            parameters: [{ type: 'text', text: btn.url }]
          }
        } else if (btn.action === 'Postback') {
          return {
            subtype: 'quick_reply',
            parameters: [{ type: 'payload', text: btn.text }]
          }
        } else {
          throw new Error(`Vonage (WhatsApp) carousel does not support "${btn.action}" action-buttons at the moment`)
        }
      })

      components = new TemplateComponents()
        .withHeader({
          type: 'image',
          image: {
            link: payload.image
          }
        })
        .withBody({
          type: 'text',
          text: payload.text
        })
        .withButtons(...buttons)
        .build()
    }

    const custom: ChannelContentCustomTemplate = {
      type: 'template',
      template: {
        namespace: this.config.useTestingApi ? TESTING_TEMPLATE_NAMESPACE : payload.namespace,
        name: this.config.useTestingApi ? TESTING_LINK_BUTTON_TEMPLATE_NAME : payload.name,
        language,
        components
      }
    }

    await this.sendMessage(event, {
      type: 'custom',
      text: undefined,
      custom
    })
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
