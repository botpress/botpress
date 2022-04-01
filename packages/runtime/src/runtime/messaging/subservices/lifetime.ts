import { MessagingClient, uuid } from '@botpress/messaging-client'
import { BotConfig } from 'botpress/runtime-sdk'
import { VError } from 'verror'
import { CloudMessagingChannel } from '../../cloud/messaging'
import { ConfigProvider } from '../../config'
import { MessagingInteractor } from './interactor'

export class MessagingLifetime {
  private botIdToClientId: { [botId: string]: uuid } = {}
  private clientIdToBotId: { [clientId: uuid]: string } = {}
  private httpClients: { [botId: string]: MessagingClient } = {}

  constructor(private configProvider: ConfigProvider, private interactor: MessagingInteractor) {}

  getClientId(botId: string) {
    return this.botIdToClientId[botId]
  }

  getBotId(clientId: uuid) {
    return this.clientIdToBotId[clientId]
  }

  getHttpClient(botId: string): MessagingClient {
    return this.httpClients[botId]
  }

  async loadMessagingForBot(botId: string) {
    const config = await this.configProvider.getBotConfig(botId)

    this.loadClientId(botId, config)

    if (process.OAUTH_ENDPOINT) {
      this.loadOAuth(botId, config)
    }
  }
  private loadClientId(botId: string, config: BotConfig) {
    if (!config.messaging) {
      throw new VError(`Bot ${botId} does not have a messaging config`)
    }

    const { clientId, clientToken, webhookToken } = config.messaging
    this.clientIdToBotId[clientId] = botId
    this.botIdToClientId[botId] = clientId

    this.httpClients[botId] = this.interactor.createHttpClientForBot(clientId, clientToken, webhookToken)
    this.interactor.client.start(clientId, { clientToken, webhookToken })
  }
  private loadOAuth(botId: string, config: BotConfig) {
    const cloud = config.cloud
    if (!cloud) {
      throw new VError(`Bot ${botId} does not have a cloud config`)
    }

    const cloudMessaging = this.interactor.client as CloudMessagingChannel
    cloudMessaging.addCloudConfig(this.getClientId(botId), cloud)
  }

  async unloadMessagingForBot(botId: string) {
    const clientId = this.botIdToClientId[botId]

    delete this.clientIdToBotId[clientId]
    delete this.botIdToClientId[botId]
    delete this.httpClients[botId]

    if (process.OAUTH_ENDPOINT) {
      const cloudMessaging = this.interactor.client as CloudMessagingChannel
      cloudMessaging.removeCloudConfig(clientId)
    }

    this.interactor.client.stop(clientId)
  }
}
