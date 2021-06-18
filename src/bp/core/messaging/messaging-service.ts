import { IO, MessagingConfig } from 'botpress/sdk'
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
      new ChannelTelegram(this.clientAdmin, this, this.ghostService),
      new ChannelTwilio(this.clientAdmin, this, this.ghostService),
      new ChannelTeams(this.clientAdmin, this, this.ghostService),
      new ChannelSlack(this.clientAdmin, this, this.ghostService),
      new ChannelVonage(this.clientAdmin, this, this.ghostService),
      new ChannelMessenger(this.clientAdmin, this, this.ghostService)
    ]

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
      <any>undefined,
      <any>undefined
    )
  }

  async loadMessagingForBot(botId: string) {
    await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)

    const config = await this.configProvider.getBotConfig(botId)
    let messaging = (config.messaging || {}) as MessagingConfig

    const conduits = {}
    for (const channel of this.channels) {
      const config = await channel.loadConfigForBot(botId)
      if (config) {
        conduits[channel.name] = config
      }
    }

    const setupConfig = {
      providerName: botId,
      conduits,
      clientId: messaging.clientId,
      webhooks: [{ url: `http://localhost:${process.PORT}/api/v1/messaging/receive` }]
    }

    const { clientId, clientToken, providerName } = await this.clientAdmin.syncClient(setupConfig)
    let modified = false

    if (clientId && clientId !== messaging.clientId) {
      messaging = {
        ...messaging,
        clientId,
        clientToken
      }
      modified = true
    }

    if (providerName && providerName !== messaging.providerName) {
      messaging = {
        ...messaging,
        providerName
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
      messaging.clientToken,
      messaging.providerName
    )
    this.clientsByBotId[botId] = botClient
    this.botsByClientId[clientId] = botId
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

  getClientForBot(botId: string) {
    return this.clientsByBotId[botId]
  }

  private async handleOutgoingEvent(event: IO.OutgoingEvent, next: IO.MiddlewareNextCallback) {
    await this.clientsByBotId[event.botId].sendMessage(event.threadId!, event.channel, event.payload)

    return next(undefined, true, false)
  }
}
