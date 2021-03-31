import Vonage, {
  ChannelContentTemplate,
  ChannelMessage,
  ChannelType,
  ChannelWhatsApp,
  MessageSendError
} from '@vonage/server-sdk'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import {
  ChannelContentCustomTemplate,
  ChannelContentLocation,
  Clients,
  VonageChannelContent,
  VonageMessageStatusBody,
  VonageRequestBody
} from './typings'

const debug = DEBUG('channel-vonage')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export const MIDDLEWARE_NAME = 'vonage.sendMessage'

// TODO: Remove this.
const TESTING_MTM_NAME = 'whatsapp:hsm:technology:nexmo:verify'
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

export class VonageClient {
  private logger: sdk.Logger
  private vonage: Vonage
  private webhookUrl: string
  private conversations: sdk.experimental.conversations.BotConversations
  private messages: sdk.experimental.messages.BotMessages

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
        apiHost: this.config.useTestingApi ? ApiBaseUrl.TEST : ApiBaseUrl.PROD
      }
    )

    this.logger.info(`Vonage webhook listening at ${this.webhookUrl}`)
  }

  async handleWebhookRequest(body: VonageRequestBody) {
    debugIncoming('Received message', body)

    // TODO: Validate from/to type === SUPPORTED_CHANNEL_TYPE ?
    const text = body.message.content.text
    const userId = body.from.number
    const _ = body.to.number

    const payload: any = { type: 'text', text }

    const conversation = await this.conversations.recent(userId)

    await this.messages.receive(conversation.id, payload, {
      channel: 'vonage'
    })
  }

  validate(body: VonageRequestBody): void {
    if (body.from.type !== SUPPORTED_CHANNEL_TYPE || body.to.type !== SUPPORTED_CHANNEL_TYPE) {
      throw new Error('Unable to process message: only Whatsapp channel is supported')
    }
  }

  // TODO: Remove this
  async handleIncomingMessageStatus(body: VonageMessageStatusBody) {
    debugIncoming('Received message status', body)
  }

  renderOutgoingEvent(event: sdk.IO.Event): sdk.IO.Event {
    // TODO: Render event payload to its proper content type.
    return event
  }

  async handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    const payload = event.payload

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
          caption: payload.title
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
    } else if (payload.type === 'file') {
      await this.sendMessage(event, {
        type: payload.type,
        text: undefined,
        file: {
          url: payload.url,
          caption: payload.title
        }
      })
    } else if (payload.type === 'location') {
      // FIXME:
      const location: ChannelContentLocation = {
        longitude: -122.425332,
        latitude: 37.758056,
        name: 'Facebook HQ',
        address: '1 Hacker Way, Menlo Park, CA 94025'
      }

      await this.sendMessage(event, {
        type: 'custom',
        text: undefined,
        custom: {
          type: 'location',
          location
        }
      })
    } else if (payload.type === 'template') {
      const template: ChannelContentTemplate = {
        name: this.config.useTestingApi ? TESTING_MTM_NAME : payload.name,
        parameters: this.config.useTestingApi ? TESTING_MTM_PARAMETERS : payload.parameters
      }
      const whatsapp: ChannelWhatsApp = {
        policy: 'deterministic',
        locale: 'en' // TODO: Fetch user language?
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
    } else if (payload.type === 'custom') {
      const language: ChannelWhatsApp = {
        policy: 'deterministic',
        locale: 'en' // TODO: Fetch user language?
      }

      // FIXME:
      const custom: ChannelContentCustomTemplate = {
        type: 'template',
        template: {
          namespace: '',
          name: '',
          language,
          components: []
        }
      }

      await this.sendMessage(event, {
        type: payload.type,
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

    debugOutgoing('Sending message', event)

    await new Promise(resolve => {
      this.vonage.channel.send(
        { type: SUPPORTED_CHANNEL_TYPE, number: event.target },
        { type: SUPPORTED_CHANNEL_TYPE, number: this.config.useTestingApi ? TESTING_PHONE_NUMBER : '' }, // FIXME:
        message,
        (err, _data) => {
          if (err) {
            // fix typings
            err = (err as any).body as MessageSendError
            console.error(err)
          } else {
            resolve()
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
