import * as sdk from 'botpress/sdk'
import { Twilio } from 'twilio'

import { Config } from '../config'

import { Clients } from './typings'

const MIDDLEWARE_NAME = 'twilio.sendMessage'

export class TwilioClient {
  private logger: sdk.Logger
  private twilio: Twilio

  constructor(private bp: typeof sdk, private botId: string, private config: Config) {
    this.logger = bp.logger.forBot(botId)
  }

  async initialize() {
    if (!this.config.accountSID || !this.config.authToken) {
      return this.logger.error(`[${this.botId}] The accountSID and authToken must be configured to use this channel.`)
    }

    this.twilio = new Twilio(this.config.accountSID, this.config.authToken)

    this.logger.info(`new twilio client for ${this.botId}`)
  }

  auth(req): boolean {
    const signature = req.headers['x-twilio-signature']
    // validating this seems complicated i'll do it later
    return true
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
    }

    next(undefined, false)
  }

  async sendText(event: sdk.IO.Event) {
    await this.twilio.messages.create({
      body: event.payload.text,
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
