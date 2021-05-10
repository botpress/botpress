import axios from 'axios'
import { IO } from 'botpress/sdk'
import { EventEngine } from 'core/events'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import { ConversationService } from './conversation-service'
import { MessageService } from './message-service'

@injectable()
export class MessagingWebhooks {
  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ConversationService) private conversationService: ConversationService,
    @inject(TYPES.MessageService) private messageService: MessageService
  ) {}

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    // TODO: register webhooks by http
    const incomingWebhooks = [
      {
        id: 'mfkt837834her',
        url: 'http://localhost:3020/hook',
        // TODO: This could be a regex (but regex is kind of garbadge to write)
        // This scope could be even further scoped for a bot: 'app.myBotId.userMessage'
        scopes: ['app.userMessage']
      }
    ]
    const outgoingWebhooks = [{ id: 'ef98484ufeb93', url: 'http://localhost:3020/hook', scopes: ['app.botMessage'] }]

    // TODO: we need to include the api key when calling the webhooks
    // TODO: why is the api key defined per workspace user??
    // const http = axios.create({ headers: { 'x-bp-api-key': key } })

    this.eventEngine.register({
      name: 'webhook.outgoing',
      description: 'Calls webhooks for outgoing events',
      // 99 is just before the order of channels (100)
      order: 99,
      direction: 'outgoing',
      handler: async (event: IO.OutgoingEvent, next) => {
        const conversation = (await this.conversationService.forBot(event.botId).get(event.threadId!))!
        if (!conversation) {
          // channel is not on messaging
          return next(undefined, false, true)
        }

        // TODO: no way to get an event's corresponding message. Should they share the same id? Or messageId property on event?
        const message = await this.messageService.forBot(event.botId).create(conversation.id, event.payload)

        const payload = {
          bot: {
            id: event.botId
          },
          // TODO: could this channel property have more things in it?
          channel: {
            id: event.channel
          },
          // TODO: replacement for state.user?
          user: {
            id: conversation.userId
          },
          conversation,
          // TODO: rename message.payload to message.content? Could be less confusing. payload.message.payload is not good.
          message
        }

        console.log('outgoing webhook', payload)

        for (const webhook of outgoingWebhooks) {
          const data = await axios.post(webhook.url, { webhook, ...payload })
          // TODO: use the returned 'data' to merge with current data and call subsequent hooks with this new data (like a web middleware chain)
          // should we register all of these webhooks as individual middlewares?
        }

        return next(undefined, false, false)
      }
    })

    this.eventEngine.register({
      name: 'webhooks.incoming',
      description: 'Calls webhooks for incoming events',
      order: 99,
      direction: 'incoming',
      handler: async (e: IO.Event, next) => {
        // TODO: fix this crap
        const event = (<any>e) as IO.IncomingEvent

        const conversation = (await this.conversationService.forBot(event.botId).get(event.threadId!))!
        if (!conversation) {
          // channel is not on messaging
          return next(undefined, false, true)
        }

        const message = await this.messageService
          .forBot(event.botId)
          .create(conversation.id, event.payload, event.target)

        const payload = {
          bot: {
            id: event.botId
          },
          channel: {
            id: event.channel
          },
          user: {
            id: conversation.userId
          },
          conversation,
          message,
          // TODO: should be cleaned up. I don't think we need all this
          nlu: event.nlu,
          // TODO: lots of garbadge in this. We definitively don't want session.lastMessages (could be in conversation.lastMessages instead)
          state: event.state
        }

        console.log('incoming webhook', payload)

        for (const webhook of incomingWebhooks) {
          const data = await axios.post(webhook.url, { webhook, ...payload })
        }

        return next(undefined, false, false)
      }
    })
  }
}
