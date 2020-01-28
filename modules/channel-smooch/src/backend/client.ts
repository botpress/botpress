import * as sdk from 'botpress/sdk'
import Smooch from 'smooch-core'

import { Config } from '../config'

import { Clients } from './typings'

const name = 'smooch.sendMessage'

export class SmoochClient {
  private smooch: any
  private path: string

  constructor(
    private bp: typeof sdk,
    private botId: string,
    private config: Config,
    private router: any,
    private route: string
  ) {}

  async initialize() {
    this.smooch = new Smooch({
      keyId: this.config.keyId,
      secret: this.config.secret,
      scope: 'app'
    })

    const url = (await this.router.getPublicPath()) + this.route
    this.path = url.replace('BOT_ID', this.botId)

    await this.smooch.webhooks.create({
      target: this.path,
      triggers: ['message:appUser']
    })
  }

  async delete() {
    const { webhooks } = await this.smooch.webhooks.list()
    for (const hook of webhooks) {
      if (hook.target == this.path) {
        await this.smooch.webhooks.delete(hook._id)
      }
    }
  }

  async handleWebhookRequest(body: any) {
    if (!body.messages) {
      return
    }

    for (const message of body.messages) {
      if (message.type !== 'text') {
        continue
      }

      await this.bp.events.sendEvent(
        this.bp.IO.Event({
          botId: this.botId,
          channel: 'smooch',
          direction: 'incoming',
          type: 'text',
          payload: {
            type: 'text',
            markdown: false,
            text: message.text
          },
          preview: message.text,
          target: body.appUser._id
        })
      )
    }
  }

  async handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.type === 'typing') {
      await this.smooch.appUsers.conversationActivity({
        appId: this.smooch.keyId,
        userId: event.target,
        activityProps: {
          role: 'appMaker',
          type: 'typing:start'
        }
      })
    } else if (event.type === 'text') {
      await this.smooch.appUsers.sendMessage({
        appId: this.smooch.keyId,
        userId: event.target,
        message: {
          text: event.payload.text,
          role: 'appMaker',
          type: 'text'
        }
      })
    }

    next(undefined, false)
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = Smooch.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name,
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'smooch') {
      return next()
    }

    const client: SmoochClient = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}

export async function removeMiddleware(bp: typeof sdk) {
  bp.events.removeMiddleware(name)
}
