import * as sdk from 'botpress/sdk'
import Smooch from 'smooch-core'

import { Config } from '../config'

import { Card, Clients, MessagePayload, Webhook } from './typings'

const MIDDLEWARE_NAME = 'smooch.sendMessage'

export class SmoochClient {
  private smooch: any
  private webhookUrl: string
  private logger: sdk.Logger
  private secret: string

  constructor(
    private bp: typeof sdk,
    private botId: string,
    private config: Config,
    private router: any,
    private route: string
  ) {
    this.logger = bp.logger.forBot(botId)
  }

  async initialize() {
    if (!this.config.keyId || !this.config.secret) {
      return this.logger.error(`[${this.botId}] The keyId and secret must be configured to use this channel.`)
    }

    this.smooch = new Smooch({
      keyId: this.config.keyId,
      secret: this.config.secret,
      scope: 'app'
    })

    const url = (await this.router.getPublicPath()) + this.route
    this.webhookUrl = url.replace('BOT_ID', this.botId)

    try {
      const { webhook }: { webhook: Webhook } = await this.smooch.webhooks.create({
        target: this.webhookUrl,
        triggers: ['message:appUser']
      })
      this.secret = webhook.secret
      this.logger.info(`[${this.botId}] Successfully created smooch webhook with url : ${webhook.target}`)
    } catch (e) {
      this.logger.attachError(e).error(`[${this.botId}] Failed to create smooch webhook`)
      throw e
    }
  }

  async removeWebhook() {
    const { webhooks }: { webhooks: Webhook[] } = await this.smooch.webhooks.list()
    for (const hook of webhooks) {
      if (hook.target === this.webhookUrl) {
        await this.smooch.webhooks.delete(hook._id)
      }
    }
  }

  auth(req): boolean {
    return req.headers['x-api-key'] === this.secret
  }

  async handleWebhookRequest(payload: MessagePayload) {
    if (!payload.messages) {
      return
    }

    for (const message of payload.messages) {
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
            text: message.text
          },
          preview: message.text,
          threadId: payload.conversation._id,
          target: payload.appUser._id
        })
      )
    }
  }

  async handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.type === 'typing') {
      await this.sendTyping(event)
    } else if (event.type === 'text') {
      await this.sendText(event)
    } else if (event.type === 'file') {
      await this.sendFile(event)
    } else if (event.type === 'carousel') {
      await this.sendCarousel(event)
    } else if (event.payload.quick_replies) {
      await this.sendChoices(event)
    } else if (event.payload.options) {
      await this.sendDropdown(event)
    }

    next(undefined, false)
  }

  async sendTyping(event: sdk.IO.Event) {
    await this.smooch.appUsers.conversationActivity({
      appId: this.smooch.keyId,
      userId: event.target,
      activityProps: {
        role: 'appMaker',
        type: 'typing:start'
      }
    })
    return new Promise(resolve => setTimeout(() => resolve(), 1000))
  }

  async sendText(event: sdk.IO.Event) {
    return this.sendMessage(
      {
        text: event.payload.text,
        role: 'appMaker',
        type: 'text'
      },
      event.target
    )
  }

  async sendFile(event: sdk.IO.Event) {
    return this.sendMessage(
      {
        role: 'appMaker',
        type: 'image',
        mediaUrl: event.payload.url
      },
      event.target
    )
  }

  async sendCarousel(event: sdk.IO.Event) {
    const cards = []
    for (const bpCard of event.payload.elements) {
      const card: Card = {
        title: bpCard.title,
        description: bpCard.subtitle,
        actions: []
      }

      // Smooch crashes if mediaUrl is defined but has no value
      if (bpCard.picture) {
        card.mediaUrl = bpCard.picture
      }

      for (const { type, title, url, payload } of bpCard.buttons) {
        if (type === 'open_url') {
          card.actions.push({
            text: title,
            type: 'link',
            uri: url
          })
        } else if (type === 'postback') {
          // This works but postback doesn't do anything
          card.actions.push({
            text: title,
            type: 'postback',
            payload
          })
        } /* else if (bpAction.type === 'say_something') {
          card.actions.push({
            text: bpAction.title,
            type: 'reply',
            payload: bpAction.text
          })
        }*/
      }

      if (card.actions.length === 0) {
        // Smooch crashes if this list is empty or undefined. However putting this dummy
        // card in seems to produce the expected result (that is seeing 0 actions)
        card.actions.push({
          text: '',
          type: 'postback',
          payload: ''
        })
      }

      cards.push(card)
    }

    return this.sendMessage(
      {
        role: 'appMaker',
        type: 'carousel',
        items: cards
      },
      event.target
    )
  }

  async sendChoices(event: sdk.IO.Event) {
    const actions = event.payload.quick_replies.map(r => ({ type: 'reply', text: r.title, payload: r.payload }))
    return this.sendMessage(
      {
        text: event.payload.text,
        role: 'appMaker',
        type: 'text',
        actions
      },
      event.target
    )
  }

  async sendDropdown(event: sdk.IO.Event) {
    const actions = event.payload.options.map(r => ({ type: 'reply', text: r.label, payload: r.value }))
    return this.sendMessage(
      {
        text: event.payload.message,
        role: 'appMaker',
        type: 'text',
        actions
      },
      event.target
    )
  }

  sendMessage = async (message, userId) => {
    return this.smooch.appUsers.sendMessage({
      appId: this.smooch.keyId,
      userId,
      message
    })
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = Smooch.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: MIDDLEWARE_NAME,
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
  bp.events.removeMiddleware(MIDDLEWARE_NAME)
}
