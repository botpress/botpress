import * as sdk from 'botpress/sdk'
import Smooch from 'smooch-core'

import { Config } from '../config'

import { Clients, MessagePayload, Webhook } from './typings'

const MIDDLEWARE_NAME = 'smooch.sendMessage'

export class SmoochClient {
  private smooch: any
  private webhookUrl: string
  private logger: sdk.Logger

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
      this.logger.info(`[${this.botId}] Successfully created smooch webhook with url : ${webhook.target}`)
    } catch (e) {
      this.logger.error(`[${this.botId}] Failed to create smooch webhook. Provided keyId and secret are likely invalid`)
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
    } else if (event.type === 'default') {
      await this.sendChoices(event)
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
  }
  async sendText(event: sdk.IO.Event) {
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
  async sendFile(event: sdk.IO.Event) {
    await this.smooch.appUsers.sendMessage({
      appId: this.smooch.keyId,
      userId: event.target,
      message: {
        role: 'appMaker',
        type: 'image',
        mediaUrl: event.payload.url
      }
    })
  }
  async sendCarousel(event: sdk.IO.Event) {
    const cards = []
    for (const bpCard of event.payload.elements) {
      const card = {
        title: bpCard.title,
        description: bpCard.subtitle,
        mediaUrl: bpCard.picture,
        actions: []
      }

      // Smooch crashes if mediaUrl is defined but has no value
      if (!card.mediaUrl) delete card.mediaUrl

      for (const bpAction of bpCard.buttons) {
        let action

        if (bpAction.type === 'open_url') {
          action = {
            text: bpAction.title,
            type: 'link',
            uri: bpAction.url
          }
        } else if (bpAction.type === 'postback') {
          // This works but postback doesn't do anything
          action = {
            text: bpAction.title,
            type: 'postback',
            payload: bpAction.payload
          }
        }
        // Doesn't work
        /*
         else if (bpAction.type === 'say_something') {
          action = {
            text: bpAction.title,
            type: 'reply',
            payload: bpAction.text
          }
        }
        */

        if (action) card.actions.push(action)
      }

      if (card.actions.length === 0) {
        // Smooch crashes if this list is empty. However putting this dummy card in seems to
        // produce the expected result (that is seeing 0 actions)
        card.actions.push({
          text: '',
          type: 'postback',
          payload: ''
        })
      }

      cards.push(card)
    }

    await this.smooch.appUsers.sendMessage({
      appId: this.smooch.keyId,
      userId: event.target,
      message: {
        role: 'appMaker',
        type: 'carousel',
        items: cards
      }
    })
  }
  async sendChoices(event: sdk.IO.Event) {
    const actions = []
    for (const reply of event.payload.quick_replies) {
      actions.push({
        type: 'reply',
        text: reply.title,
        payload: reply.payload
      })
    }

    await this.smooch.appUsers.sendMessage({
      appId: this.smooch.keyId,
      userId: event.target,
      message: {
        text: event.payload.text,
        role: 'appMaker',
        type: 'text',
        actions
      }
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
