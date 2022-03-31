import { MessagingClient, uuid } from '@botpress/messaging-client'
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
    const botConfig = await this.configProvider.getBotConfig(botId)
    if (!botConfig.messaging) {
      throw new Error(`Bot ${botId} does not have a messaging config`)
    }

    const { clientId, clientToken, webhookToken } = botConfig.messaging

    this.clientIdToBotId[clientId] = botId
    this.botIdToClientId[botId] = clientId
    this.httpClients[botId] = this.interactor.createHttpClientForBot(clientId, clientToken, webhookToken)

    this.interactor.client.start(clientId, { clientToken, webhookToken })
  }

  async unloadMessagingForBot(botId: string) {
    const clientId = this.botIdToClientId[botId]

    delete this.clientIdToBotId[clientId]
    delete this.botIdToClientId[botId]
    delete this.httpClients[botId]

    this.interactor.client.stop(clientId)
  }
}
