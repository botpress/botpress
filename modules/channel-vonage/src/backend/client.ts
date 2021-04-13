import Vonage, {
  ChannelContentTemplate,
  ChannelMessage,
  ChannelType,
  ChannelWhatsApp,
  MessageSendError
} from '@vonage/server-sdk'
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

// TODO: Remove this.
const TESTING_TEMPLATE_NAMESPACE = '9b6b4fcb_da19_4a26_8fe8_78074a91b584'
const TESTING_QUICK_REPLY_TEMPLATE_NAME = 'sandbox_doctors_appointment'
const TESTING_LINK_BUTTON_TEMPLATE_NAME = 'sandbox_travel_boardingpass'
const TESTING_MTM_NAME = `${TESTING_TEMPLATE_NAMESPACE}:verify`
const TESTING_MTM_PARAMETERS = [
  {
    default: 'Vonage Verification'
  },
  {
    default: '64873'
  },
  {
    default: '10'
  }
]
const TESTING_PHONE_NUMBER = '14157386170'

const SUPPORTED_CHANNEL_TYPE: ChannelType = 'whatsapp'
enum ApiBaseUrl {
  TEST = 'https://messages-sandbox.nexmo.com',
  PROD = 'https://api.nexmo.com'
}
const formatKVSKey = (id: string) => `vonage-number::${id}`

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

  renderOutgoingEvent(event: sdk.IO.OutgoingEvent): sdk.IO.Event {
    // TODO: Render event payload to its proper content type.
    debugOutgoing('Rendering event', event)

    event.payload.type = 'link_button'
    return event
    /*
    if (event.type === 'image') {
      return {
        ...event,
        payload: {
          type: event.type,
          url: event.payload.image,
          caption: event.payload.title
        }
      }
    } else if (event.type === 'audio') {
      return {
        ...event,
        payload: {
          type: event.type,
          url: event.payload.audio
        }
      }
    } else if (event.type === 'video') {
      return {
        ...event,
        payload: {
          type: event.type,
          url: event.payload.video
        }
      }
    } else if (event.type === 'quick_reply') {
      return {
        ...event,
        payload: {
          type: event.type,
          text: event.payload.text,
          subtitle: event.payload.dropdownPlaceholder,
          choices: event.payload.choices
        }
      }
    }

    return event */
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
    } else if (payload.type === 'template') {
      const template: ChannelContentTemplate = {
        name: this.config.useTestingApi ? TESTING_MTM_NAME : payload.name,
        parameters: this.config.useTestingApi ? TESTING_MTM_PARAMETERS : payload.parameters
      }
      const whatsapp: ChannelWhatsApp = {
        policy: 'deterministic',
        locale: 'en-US'
      }

      await this.sendMessage(
        event,
        {
          type: payload.type,
          text: undefined,
          template
        },
        whatsapp
      )
    } else if (payload.type === 'quick_reply') {
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
        const buttons: Buttons = payload.choices.map(choice => ({
          subType: 'quick_reply',
          parameters: [{ type: 'payload', payload: choice.text }]
        }))

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
    } else if (payload.type === 'link_button') {
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
        const buttons: Buttons = (payload.actions || []).map(a => {
          if (a.action === 'Open URL') {
            return {
              subtype: 'url',
              parameters: [{ type: 'text', text: a.url }]
            }
          } else if (a.action === 'Postback') {
            return {
              subtype: 'quick_reply',
              parameters: [{ type: 'payload', text: a.text }]
            }
          } else {
            // TODO: Throw an error?
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
    next(undefined, false)
  }

  async sendMessage(event: sdk.IO.Event, content: VonageChannelContent, whatsapp?: ChannelWhatsApp) {
    const message: ChannelMessage = {
      content,
      whatsapp
    }

    debugOutgoing('Sending message', JSON.stringify(message, null, 2))

    const userId = event.target
    const conversation = await this.conversations.recent(userId)
    const { botPhoneNumber } = await this.kvs.get(formatKVSKey(conversation.id))

    await new Promise(resolve => {
      this.vonage.channel.send(
        { type: SUPPORTED_CHANNEL_TYPE, number: event.target },
        {
          type: SUPPORTED_CHANNEL_TYPE,
          number: this.config.useTestingApi ? TESTING_PHONE_NUMBER : botPhoneNumber
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
