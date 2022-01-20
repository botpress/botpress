import { ConversationStartedEvent, MessageNewEvent, MessagingChannel, uuid } from '@botpress/messaging-client'
import { IO, Logger, MessagingConfig } from 'botpress/runtime-sdk'
import { inject, injectable } from 'inversify'
import LRUCache from 'lru-cache'
import ms from 'ms'
import yn from 'yn'

import { formatUrl } from '../../common/url'
import { ConfigProvider } from '../config'
import { EventEngine, Event } from '../events'
import { TYPES } from '../types'

@injectable()
export class MessagingService {
  public messaging!: MessagingChannel
  private botIdToClientId: { [botId: string]: uuid } = {}
  private clientIdToBotId: { [clientId: uuid]: string } = {}
  private channelNames = ['messenger', 'slack', 'smooch', 'teams', 'telegram', 'twilio', 'vonage']
  private newUsers: number = 0
  private collectingCache: LRUCache<string, uuid>

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger) private logger: Logger
  ) {
    this.collectingCache = new LRUCache<string, uuid>({ max: 5000, maxAge: ms('5m') })
    this.messaging = new MessagingChannel({
      url: process.MESSAGING_ENDPOINT!
    })
    // use this to test converse from messaging
    if (yn(process.env.ENABLE_EXPERIMENTAL_CONVERSE)) {
      this.channelNames.push('messaging')
    }
  }

  async initialize() {
    this.eventEngine.register({
      name: 'messaging.fixUrl',
      description: 'Fix payload url before sending them',
      order: 99,
      direction: 'outgoing',
      handler: this.fixOutgoingUrls.bind(this)
    })

    if (!process.MESSAGING_ENDPOINT) {
      this.logger.warn('No messaging endpoint provided, some features will not work as expected.')
      return
    }

    this.eventEngine.register({
      name: 'messaging.sendOut',
      description: 'Sends outgoing messages to external messaging',
      order: 20000,
      direction: 'outgoing',
      handler: this.handleOutgoingEvent.bind(this)
    })

    this.messaging.on('user', this.handleUserNewEvent.bind(this))
    this.messaging.on('started', this.handleConversationStartedEvent.bind(this))
    this.messaging.on('message', this.handleMessageNewEvent.bind(this))
  }

  async loadMessagingForBot(botId: string) {
    const config = await this.configProvider.getBotConfig(botId)
    const messaging = (config.messaging || {}) as Partial<MessagingConfig>

    this.messaging.start(messaging.id!, { clientToken: messaging.token })
    const { webhooks } = await this.messaging.sync(messaging.id!, {
      channels: messaging.channels,
      webhooks: [{ url: `${process.EXTERNAL_URL}/api/v1/chat/receive` }]
    })

    this.clientIdToBotId[messaging.id!] = botId
    this.botIdToClientId[botId] = messaging.id!
    this.messaging.start(messaging.id!, { clientToken: messaging.token, webhookToken: webhooks[0].token })
  }

  async unloadMessagingForBot(botId: string) {
    const config = await this.configProvider.getBotConfig(botId)
    if (!config.messaging?.id) {
      return
    }

    delete this.clientIdToBotId[config.messaging.id]
    delete this.botIdToClientId[botId]
  }

  informProcessingDone(event: IO.IncomingEvent) {
    if (this.collectingCache.get(event.id!)) {
      // We don't want the waiting for the queue to be empty to freeze other messages
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.sendProcessingDone(event)
    }
  }

  getNewUsersCount({ resetCount }: { resetCount: boolean }) {
    const count = this.newUsers
    if (resetCount) {
      this.newUsers = 0
    }
    return count
  }

  private handleUserNewEvent() {
    this.newUsers++
  }

  private async handleConversationStartedEvent(clientId: uuid, data: ConversationStartedEvent) {
    if (!this.channelNames.includes(data.channel)) {
      return
    }

    const event = Event({
      direction: 'incoming',
      type: 'proactive-trigger',
      payload: {},
      channel: data.channel,
      threadId: data.conversationId,
      target: data.userId,
      botId: this.clientIdToBotId[clientId]
    })

    return this.eventEngine.sendEvent(event)
  }

  private async handleMessageNewEvent(clientId: uuid, data: MessageNewEvent) {
    if (!this.channelNames.includes(data.channel)) {
      return
    }

    const event = Event({
      direction: 'incoming',
      type: data.message.payload.type,
      payload: data.message.payload,
      channel: data.channel,
      threadId: data.conversationId,
      target: data.userId,
      messageId: data.message.id,
      botId: this.clientIdToBotId[clientId]
    })

    if (data.collect) {
      this.collectingCache.set(event.id, data.message.id)
    }

    return this.eventEngine.sendEvent(event)
  }

  private async fixOutgoingUrls(event: IO.OutgoingEvent, next: IO.MiddlewareNextCallback) {
    this.fixPayloadUrls(event.payload)
    next()
  }

  private async handleOutgoingEvent(event: IO.OutgoingEvent, next: IO.MiddlewareNextCallback) {
    if (!this.channelNames.includes(event.channel)) {
      return next(undefined, false, true)
    }

    const collecting = event.incomingEventId && this.collectingCache.get(event.incomingEventId)
    const message = await this.messaging.createMessage(
      this.botIdToClientId[event.botId],
      event.threadId!,
      undefined,
      event.payload,
      collecting ? { incomingId: collecting } : undefined
    )
    event.messageId = message.id

    return next(undefined, true, false)
  }

  private async sendProcessingDone(event: IO.IncomingEvent) {
    try {
      await this.eventEngine.waitOutgoingQueueEmpty(event)
      await this.messaging.endTurn(this.botIdToClientId[event.botId], event.messageId!)
    } catch (e) {
      this.logger.attachError(e).error('Failed to inform messaging of completed processing')
    } finally {
      this.collectingCache.del(event.id!)
    }
  }

  private fixPayloadUrls(payload: any) {
    if (typeof payload !== 'object' || payload === null) {
      if (typeof payload === 'string') {
        payload = payload.replace('BOT_URL', process.EXTERNAL_URL)
      }

      return formatUrl(process.EXTERNAL_URL, payload, process.env.MEDIA_URL)
    }

    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          value[i] = this.fixPayloadUrls(value[i])
        }
      } else {
        payload[key] = this.fixPayloadUrls(value)
      }
    }

    return payload
  }
}
