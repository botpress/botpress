import * as sdk from 'botpress/sdk'
import { Twilio, validateRequest } from 'twilio'

import { Config } from '../config'

import { Clients } from './typings'

const MIDDLEWARE_NAME = 'twilio.sendMessage'

export class TwilioClient {
  private logger: sdk.Logger
  private twilio: Twilio
  private webhookUrl: string

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

    this.logger.info(`Twilio webhook listening at ${this.webhookUrl}`)
  }

  auth(req): boolean {
    const signature = req.headers['x-twilio-signature']
    return validateRequest(this.config.authToken, signature, this.webhookUrl, req.body)
  }

  async handleWebhookRequest(body: any) {
    const to = body.To
    const from = body.From
    const text = body.Body

    await this.bp.events.sendEvent(
      this.bp.IO.Event({
        botId: this.botId,
        channel: 'twilio',
        direction: 'incoming',
        type: 'text',
        payload: {
          type: 'text',
          text: text
        },
        preview: text,
        threadId: to,
        target: from
      })
    )
  }

  async handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.type === 'text') {
      await this.sendText(event)
    } else if (event.type === 'file') {
      await this.sendImage(event)
    } else if (event.type === 'carousel') {
      await this.sendCarousel(event)
    } else if (event.payload.quick_replies) {
      await this.sendChoices(event)
    } else if (event.payload.options) {
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
    for (const { description, title, picture } of event.payload.elements) {
      await this.sendMessage(event, {
        body: description ? title + '\n' + description : title,
        mediaUrl: picture ? [picture] : undefined
      })
    }
  }

  async sendChoices(event: sdk.IO.Event) {
    let body = event.payload.text
    for (const choice of event.payload.quick_replies) {
      body += `\n${choice.title}`
    }

    await this.sendMessage(event, { body })
  }

  async sendDropdown(event: sdk.IO.Event) {
    let body = event.payload.message
    for (const choice of event.payload.options) {
      body += `\n${choice.label}`
    }

    await this.sendMessage(event, { body })
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
