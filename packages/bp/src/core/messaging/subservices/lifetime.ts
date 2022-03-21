import { uuid } from '@botpress/messaging-client'
import { Logger, MessagingConfig } from 'botpress/sdk'
import chalk from 'chalk'
import { ConfigProvider } from 'core/config'
import { MessagingInteractor } from './interactor'

export class MessagingLifetime {
  private botIdToClientId: { [botId: string]: uuid } = {}
  private clientIdToBotId: { [clientId: uuid]: string } = {}

  constructor(
    private logger: Logger,
    private configProvider: ConfigProvider,
    private interactor: MessagingInteractor
  ) {}

  getClientId(botId: string) {
    return this.botIdToClientId[botId]
  }

  getBotId(clientId: uuid) {
    return this.clientIdToBotId[clientId]
  }

  async loadMessagingForBot(botId: string) {
    await this.interactor.waitReady()

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

    let clientIdExists = false
    if (messaging.id?.length && messaging.token?.length) {
      this.interactor.client.start(messaging.id, { clientToken: messaging.token })
      clientIdExists = await this.interactor.client.getClient(messaging.id)
    }

    if (!clientIdExists) {
      const { id, token } = await this.interactor.client.createClient()
      messaging = {
        ...messaging,
        id,
        token
      }

      await this.configProvider.mergeBotConfig(botId, { messaging })
    }

    await this.interactor.client.renameClient(messaging.id!, botId)
    this.clientIdToBotId[messaging.id!] = botId
    this.botIdToClientId[botId] = messaging.id!

    this.interactor.client.start(messaging.id!, { clientToken: messaging.token })
    const { webhooks } = await this.interactor.client.sync(messaging.id!, {
      channels: messaging.channels,
      webhooks: [
        { url: this.interactor.isExternal ? `${process.EXTERNAL_URL}/api/v1/chat/receive` : 'http://dummy.com' }
      ]
    })

    const webhookToken = webhooks[0].token
    this.interactor.client.start(messaging.id!, { clientToken: messaging.token, webhookToken })

    this.printWebhooks(botId, messaging.channels)
  }

  async unloadMessagingForBot(botId: string) {
    await this.interactor.waitReady()

    const config = await this.configProvider.getBotConfig(botId)
    if (!config.messaging?.id) {
      return
    }

    delete this.clientIdToBotId[config.messaging.id]
    delete this.botIdToClientId[botId]

    await this.interactor.client.sync(config.messaging.id, {})
  }

  private printWebhooks(botId: string, channels: any) {
    const webhooksSpecialCases = { slack: ['interactive', 'events'], vonage: ['inbound', 'status'] }

    for (const [key, config] of Object.entries<any>(channels || {})) {
      const webhooks = config.version === '1.0.0' ? undefined : webhooksSpecialCases[key]

      for (const webhook of webhooks || [undefined]) {
        this.logger
          .forBot(botId)
          .info(
            `[${botId}] ${chalk.bold(key.charAt(0).toUpperCase() + key.slice(1))} ${
              webhook ? `${webhook} ` : ''
            }webhook ${chalk.dim(
              `${process.EXTERNAL_URL}/api/v1/messaging/webhooks${
                channels[key].version === '1.0.0' ? '/v1' : ''
              }/${botId}/${key}${webhook ? `/${webhook}` : ''}`
            )}`
          )
      }
    }
  }
}
