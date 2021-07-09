import { IO, Logger, MessagingConfig } from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import { EventEngine, Event } from 'core/events'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import { Channel } from './channels/base'
import { ChannelMessenger } from './channels/messenger'
import { ChannelSlack } from './channels/slack'
import { ChannelTeams } from './channels/teams'
import { ChannelTelegram } from './channels/telegram'
import { ChannelTwilio } from './channels/twilio'
import { ChannelVonage } from './channels/vonage'
import { MessagingClient } from './messaging-client'

@injectable()
export class MessagingService {
  public channels!: Channel[]
  private channelNames!: string[]

  private clientAdmin!: MessagingClient

  private clientsByBotId: { [botId: string]: MessagingClient } = {}
  private botsByClientId: { [clientId: string]: string } = {}

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.GhostService) private ghostService: GhostService
  ) {}

  @postConstruct()
  async init() {
    this.channels = [
      new ChannelTelegram(this, this.ghostService),
      new ChannelTwilio(this, this.ghostService),
      new ChannelTeams(this, this.ghostService),
      new ChannelSlack(this, this.ghostService),
      new ChannelVonage(this, this.ghostService),
      new ChannelMessenger(this, this.ghostService)
    ]
    this.channelNames = this.channels.map(x => x.name)

    this.eventEngine.register({
      name: 'messaging.sendOut',
      description: 'Sends outgoing messages to external messaging',
      order: 20000,
      direction: 'outgoing',
      handler: this.handleOutgoingEvent.bind(this)
    })

    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    this.clientAdmin = new MessagingClient(
      `http://localhost:${process.MESSAGING_PORT}`,
      process.INTERNAL_PASSWORD,
      <any>undefined,
      <any>undefined
    )

    for (const channel of this.channels) {
      channel.client = this.clientAdmin
    }
  }

  async loadMessagingForBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    const botpressConfig = await this.configProvider.getBotpressConfig()
    const config = await this.configProvider.getBotConfig(botId)
    let messaging = (config.messaging || {}) as MessagingConfig

    const channels = {}
    for (const channel of this.channels) {
      // Check if channel is enabled Botpress-wide
      const channelConfig = botpressConfig.channels.find(c => c.name === channel.name)
      if (!channelConfig || !channelConfig.enabled) {
        continue
      }

      const config = await channel.loadConfigForBot(botId)
      if (config) {
        channels[channel.name] = config
      }
    }

    const setupConfig = {
      id: messaging.clientId,
      token: messaging.clientToken,
      name: botId,
      channels,
      webhooks: [{ url: `http://localhost:${process.PORT}/api/v1/messaging/receive` }]
    }

    const { id, token } = await this.clientAdmin.syncClient(setupConfig)
    let modified = false

    if (id && id !== messaging.clientId) {
      messaging = {
        ...messaging,
        clientId: id,
        clientToken: token
      }
      modified = true
    }

    if (modified) {
      await this.configProvider.mergeBotConfig(botId, { messaging })
    }

    const botClient = new MessagingClient(
      `http://localhost:${process.MESSAGING_PORT}`,
      process.INTERNAL_PASSWORD,
      messaging.clientId,
      messaging.clientToken
    )
    this.clientsByBotId[botId] = botClient
    this.botsByClientId[id] = botId
  }

  async unloadMessagingForBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    const config = await this.configProvider.getBotConfig(botId)
    if (!config.messaging?.clientId) {
      return
    }

    await this.clientAdmin.syncClient({
      id: config.messaging.clientId,
      token: config.messaging.clientToken,
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
    if (this.channelNames.includes(event.channel)) {
      await this.clientsByBotId[event.botId].sendMessage(event.threadId!, event.channel, event.payload)
    }

    return next(undefined, true, false)
  }
}
