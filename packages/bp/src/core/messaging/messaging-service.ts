import {
  ConversationStartedEvent,
  MessageFeedbackEvent,
  MessageNewEvent,
  MessagingChannel,
  uuid
} from '@botpress/messaging-client'
import { AxiosRequestConfig } from 'axios'
import { IO, Logger, MessagingConfig } from 'botpress/sdk'
import { formatUrl, isBpUrl } from 'common/url'
import { ConfigProvider } from 'core/config'
import { WellKnownFlags } from 'core/dialog'
import { EventEngine, Event, EventRepository } from 'core/events'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import LRUCache from 'lru-cache'
import ms from 'ms'
import yn from 'yn'

@injectable()
export class MessagingService {
  public messaging!: MessagingChannel
  private botIdToClientId: { [botId: string]: uuid } = {}
  private clientIdToBotId: { [clientId: uuid]: string } = {}
  private channelNames = ['messenger', 'slack', 'smooch', 'teams', 'telegram', 'twilio', 'vonage']
  private newUsers: number = 0
  private collectingCache: LRUCache<string, uuid>

  public isExternal: boolean

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.EventRepository) private eventRepo: EventRepository,
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

    this.messaging = new MessagingChannel({
      url: this.getMessagingUrl(),
      axios: this.getAxiosConfig(),
      adminKey: this.isExternal ? process.env.MESSAGING_ADMIN_KEY : process.env.INTERNAL_PASSWORD,
      logger: {
        info: this.logger.info.bind(this.logger),
        debug: this.logger.debug.bind(this.logger),
        warn: this.logger.warn.bind(this.logger),
        error: (e, msg, data) => {
          this.logger.attachError(e).error(msg || '', data)
        }
      }
    })
    this.messaging.on('user', this.handleUserNewEvent.bind(this))
    this.messaging.on('started', this.handleConversationStartedEvent.bind(this))
    this.messaging.on('message', this.handleMessageNewEvent.bind(this))
    this.messaging.on('feedback', this.handleMessageFeedback.bind(this))

    if (!this.isExternal) {
      await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)
    }
    this.messaging.url = this.getMessagingUrl()
  }

  async loadMessagingForBot(botId: string) {
    if (!this.isExternal) {
      await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)
    }

    const config = await this.configProvider.getBotConfig(botId)
    let messaging = (config.messaging || {}) as Partial<MessagingConfig>

    const messagingId = messaging.id || ''
    // ClientId is already used by another botId, we will generate new credentials for this bot
    if (this.clientIdToBotId[messagingId] && this.clientIdToBotId[messagingId] !== botId) {
      this.logger.warn(
        `ClientId ${messagingId} already in use by bot ${this.clientIdToBotId[messagingId]}. Removing channels configuration and generating new credentials for bot ${botId}`
      )
      delete messaging.id
      delete messaging.token
      delete messaging.channels
    }

    const { id, token } = await this.messaging.syncClient({ name: botId, id: messaging.id, token: messaging.token })
    if (id !== messaging.id || token !== messaging.token) {
      messaging = {
        ...messaging,
        id,
        token
      }

      await this.configProvider.mergeBotConfig(botId, { messaging })
    }

    this.clientIdToBotId[id] = botId
    this.botIdToClientId[botId] = id
    this.messaging.start(messaging.id!, { clientToken: messaging.token })

    const webhookUrl = this.isExternal
      ? `${process.EXTERNAL_URL}/api/v1/chat/receive`
      : // We set a dummy webhook to get back a webhook token. The actual url that will be called is SPINNED_URL
        'http://dummy.com'

    // Fill env variables into bot messages.channels using template:
    // %MY_ENV_VAR%
    if (messaging.channels) {
      messaging.channels = Object.keys(messaging.channels).reduce((newChannels, chKey) => {
        const { channels } = messaging as any // @ts-hack, channels will exist because of conditional above
        newChannels[chKey] = Object.keys(channels[chKey]).reduce((channel, key) => {
          const value: string = channels[chKey][key]
          if (typeof value === 'string') {
            channel[key] = value.match(/^%.*%$/) ? process.env[value.replace(/%/g, '')] || value : value
          } else {
            channel[key] = value
          }
          return channel
        }, {})
        return newChannels
      }, {})
    }

    const setupConfig = {
      channels: messaging.channels,
      webhooks: [{ url: webhookUrl }]
    }

    const { webhooks } = await this.messaging.sync(messaging.id!, setupConfig)

    let webhookToken: string | undefined = undefined
    if (webhooks?.length) {
      for (const webhook of webhooks) {
        if (webhook.url === webhookUrl) {
          webhookToken = webhook.token!
        }
      }
    }

    this.messaging.start(messaging.id!, { clientToken: messaging.token, webhookToken })
  }

  async unloadMessagingForBot(botId: string) {
    if (!this.isExternal) {
      await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)
    }

    const config = await this.configProvider.getBotConfig(botId)
    if (!config.messaging?.id) {
      return
    }

    delete this.clientIdToBotId[config.messaging.id]
    delete this.botIdToClientId[botId]

    await this.messaging.sync(config.messaging.id, {})
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
    event.setFlag(WellKnownFlags.SKIP_DIALOG_ENGINE, true)

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

  private async handleMessageFeedback(clientId: uuid, data: MessageFeedbackEvent) {
    const botId = this.clientIdToBotId[clientId]
    const [event] = await this.eventRepo.findEvents({ botId, messageId: data.messageId })

    if (event?.incomingEventId) {
      await this.eventRepo.saveUserFeedback(event.incomingEventId, data.userId, data.feedback, 'qna')
    }
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

  private getMessagingUrl() {
    return process.core_env.MESSAGING_ENDPOINT
      ? process.core_env.MESSAGING_ENDPOINT
      : `http://localhost:${process.MESSAGING_PORT}`
  }

  private getAxiosConfig(): AxiosRequestConfig {
    const config: AxiosRequestConfig = {}

    if (!this.isExternal) {
      config.proxy = false
      config.headers = { password: process.env.INTERNAL_PASSWORD }
    }

    return config
  }
}
