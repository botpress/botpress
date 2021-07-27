import { IO, MessagingConfig } from 'botpress/sdk'
import { ConfigProvider } from 'core/config'
import { EventEngine, Event } from 'core/events'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import { MessagingClient } from './messaging-client'

@injectable()
export class MessagingService {
  private clientSync!: MessagingClient
  private clientsByBotId: { [botId: string]: MessagingClient } = {}
  private botsByClientId: { [clientId: string]: string } = {}
  private channelNames = ['messenger', 'slack', 'smooch', 'teams', 'telegram', 'twilio', 'vonage']

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  @postConstruct()
  async init() {
    this.eventEngine.register({
      name: 'messaging.sendOut',
      description: 'Sends outgoing messages to external messaging',
      order: 20000,
      direction: 'outgoing',
      handler: this.handleOutgoingEvent.bind(this)
    })

    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    this.clientSync = new MessagingClient(`http://localhost:${process.MESSAGING_PORT}`, process.INTERNAL_PASSWORD)
  }

  async loadMessagingForBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    const config = await this.configProvider.getBotConfig(botId)
    let messaging = (config.messaging || {}) as MessagingConfig

    const setupConfig = {
      name: botId,
      ...messaging
      // We use the SPINNED_URL env var for now to force the messaging server to
      // make its webhook requests to the process that started it.
      // webhooks: [{ url: `${process.EXTERNAL_URL}/api/v1/chat/receive` }]
    }

    const { id, token } = await this.clientSync.syncClient(setupConfig)

    if (id && id !== messaging.id) {
      messaging = {
        ...messaging,
        id,
        token
      }

      await this.configProvider.mergeBotConfig(botId, { messaging })
    }

    const botClient = new MessagingClient(
      `http://localhost:${process.MESSAGING_PORT}`,
      process.INTERNAL_PASSWORD,
      messaging.id,
      messaging.token
    )
    this.clientsByBotId[botId] = botClient
    this.botsByClientId[id] = botId
  }

  async unloadMessagingForBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    const config = await this.configProvider.getBotConfig(botId)
    if (!config.messaging?.id) {
      return
    }

    await this.clientSync.syncClient({
      id: config.messaging.id,
      token: config.messaging.token,
      name: botId,
      channels: {},
      webhooks: []
    })
  }

  async receive(clientId: string, channel: string, userId: string, conversationId: string, payload: any) {
    return this.eventEngine.sendEvent(
      Event({
        direction: 'incoming',
        type: payload.type,
        payload,
        channel,
        threadId: conversationId,
        target: userId,
        botId: this.botsByClientId[clientId]
      })
    )
  }

  private async handleOutgoingEvent(event: IO.OutgoingEvent, next: IO.MiddlewareNextCallback) {
    if (!this.channelNames.includes(event.channel)) {
      return next(undefined, false, true)
    }

    // TODO: validate payload types here
    await this.clientsByBotId[event.botId].sendMessage(event.threadId!, event.channel, event.payload)

    return next(undefined, true, false)
  }
}
