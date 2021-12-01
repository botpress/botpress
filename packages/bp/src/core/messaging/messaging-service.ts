import { MessagingClient, uuid } from '@botpress/messaging-client'
import { AxiosRequestConfig } from 'axios'
import { IO, Logger, MessagingConfig } from 'botpress/sdk'
import { formatUrl, isBpUrl } from 'common/url'
import { ConfigProvider } from 'core/config'
import { EventEngine, Event } from 'core/events'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import LRUCache from 'lru-cache'
import ms from 'ms'
import yn from 'yn'
import { MessageNewEventData, ConversationStartedEventData } from './messaging-router'

@injectable()
export class MessagingService {
  private clientSync!: MessagingClient
  private clientsByBotId: { [botId: string]: MessagingClient } = {}
  private botsByClientId: { [clientId: string]: string } = {}
  private webhookTokenByClientId: { [botId: string]: string } = {}
  private channelNames = ['messenger', 'slack', 'smooch', 'teams', 'telegram', 'twilio', 'vonage']
  private newUsers: number = 0
  private collectingCache: LRUCache<string, uuid>

  public isExternal: boolean

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Logger) private logger: Logger
  ) {
    this.isExternal = Boolean(process.core_env.MESSAGING_ENDPOINT)
    this.collectingCache = new LRUCache<string, uuid>({ max: 5000, maxAge: ms('5m') })

    // use this to test converse from messaging
    if (yn(process.env.ENABLE_EXPERIMENTAL_CONVERSE)) {
      this.channelNames.push('messaging')
    }
  }

  @postConstruct()
  async init() {
    this.eventEngine.register({
      name: 'messaging.fixUrl',
      description: 'Fix payload url before sending them',
      order: 99,
      direction: 'outgoing',
      handler: this.fixOutgoingUrls.bind(this)
    })

    this.eventEngine.register({
      name: 'messaging.sendOut',
      description: 'Sends outgoing messages to external messaging',
      order: 20000,
      direction: 'outgoing',
      handler: this.handleOutgoingEvent.bind(this)
    })

    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    this.clientSync = new MessagingClient({ url: this.getMessagingUrl(), config: this.getAxiosConfig() })
  }

  async loadMessagingForBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    const config = await this.configProvider.getBotConfig(botId)
    let messaging = (config.messaging || {}) as Partial<MessagingConfig>

    const messagingId = messaging.id || ''
    // ClientId is already used by another botId, we will generate new credentials for this bot
    if (this.botsByClientId[messagingId] && this.botsByClientId[messagingId] !== botId) {
      this.logger.warn(
        `ClientId ${messagingId} already in use by bot ${this.botsByClientId[messagingId]}. Removing channels configuration and generating new credentials for bot ${botId}`
      )
      delete messaging.id
      delete messaging.token
      delete messaging.channels
    }

    const webhookUrl = `${process.EXTERNAL_URL}/api/v1/chat/receive`
    const setupConfig = {
      name: botId,
      ...messaging,
      // We use the SPINNED_URL env var to force the messaging server to make its webhook
      // requests to the process that started it when using a local Messaging server
      webhooks: this.isExternal ? [{ url: webhookUrl }] : []
    }

    const { id, token, webhooks } = await this.clientSync.syncs.sync(setupConfig)

    if (webhooks?.length) {
      for (const webhook of webhooks) {
        if (webhook.url === webhookUrl) {
          this.webhookTokenByClientId[id] = webhook.token!
        }
      }
    }

    if (id && id !== messaging.id) {
      messaging = {
        ...messaging,
        id,
        token
      }

      await this.configProvider.mergeBotConfig(botId, { messaging })
    }

    const botClient = new MessagingClient({
      url: this.getMessagingUrl(),
      auth: { clientId: messaging.id!, clientToken: messaging.token! },
      config: this.getAxiosConfig()
    })
    this.clientsByBotId[botId] = botClient
    this.botsByClientId[id] = botId
  }

  async unloadMessagingForBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    const config = await this.configProvider.getBotConfig(botId)
    if (!config.messaging?.id) {
      return
    }

    delete this.botsByClientId[config.messaging.id]

    await this.clientSync.syncs.sync({
      id: config.messaging.id,
      token: config.messaging.token,
      name: botId,
      channels: {},
      webhooks: []
    })
  }

  async receive(msg: MessageNewEventData) {
    if (!this.channelNames.includes(msg.channel)) {
      return
    }

    const event = Event({
      direction: 'incoming',
      type: msg.message.payload.type,
      payload: msg.message.payload,
      channel: msg.channel,
      threadId: msg.conversationId,
      target: msg.userId,
      messageId: msg.message.id,
      botId: this.botsByClientId[msg.clientId]
    })

    if (msg.collect) {
      this.collectingCache.set(event.id, msg.message.id)
    }

    return this.eventEngine.sendEvent(event)
  }

  async conversationStarted(msg: ConversationStartedEventData) {
    if (!this.channelNames.includes(msg.channel)) {
      return
    }

    const event = Event({
      direction: 'incoming',
      type: 'proactive-trigger',
      payload: {},
      channel: msg.channel,
      threadId: msg.conversationId,
      target: msg.userId,
      botId: this.botsByClientId[msg.clientId]
    })

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
    const message = await this.clientsByBotId[event.botId].messages.create(
      event.threadId!,
      undefined,
      event.payload,
      collecting ? { incomingId: collecting } : undefined
    )
    event.messageId = message.id

    return next(undefined, true, false)
  }

  public informProcessingDone(event: IO.IncomingEvent) {
    if (this.collectingCache.get(event.id!)) {
      // We don't want the waiting for the queue to be empty to freeze other messages
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.sendProcessingDone(event)
    }
  }

  private async sendProcessingDone(event: IO.IncomingEvent) {
    try {
      await this.eventEngine.waitOutgoingQueueEmpty(event)
      await this.clientsByBotId[event.botId].messages.endTurn(event.messageId!)
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

      if (isBpUrl(payload)) {
        payload = formatUrl(process.EXTERNAL_URL, payload)
      }
      return payload
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

  public getMessagingUrl() {
    return process.core_env.MESSAGING_ENDPOINT
      ? process.core_env.MESSAGING_ENDPOINT
      : `http://localhost:${process.MESSAGING_PORT}`
  }

  public getWebhookToken(clientId: string) {
    return this.webhookTokenByClientId[clientId]
  }

  public getNewUsersCount({ resetCount }: { resetCount: boolean }) {
    const count = this.newUsers
    if (resetCount) {
      this.newUsers = 0
    }
    return count
  }

  public incrementNewUsersCount() {
    this.newUsers++
  }

  private getAxiosConfig(): AxiosRequestConfig {
    const config: AxiosRequestConfig = {}

    if (!this.isExternal) {
      config.proxy = false
      config.headers = { password: process.INTERNAL_PASSWORD }
    }

    return config
  }
}
