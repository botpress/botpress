import _ from 'lodash'
import { ConfigProvider } from 'runtime/config'
import { NLUClient } from './client'

export class NLUClientProvider {
  private _baseClient: NLUClient | undefined
  private _clientPerBot: { [botId: string]: NLUClient } = {}

  constructor(private configProvider: ConfigProvider) {}

  public getbaseClient(): NLUClient | undefined {
    return this._baseClient
  }

  public getClientForBot(botId: string): NLUClient | undefined {
    return this._clientPerBot[botId]
  }

  public async initialize() {
    if (!process.core_env.NLU_ENDPOINT) {
      throw new Error('NLU Endpoint is not provided.')
    }

    this._baseClient = new NLUClient({ endpoint: process.core_env.NLU_ENDPOINT })
  }

  public async mountBot(botId: string) {
    const botConfig = await this.configProvider.getBotConfig(botId)

    const client = new NLUClient({ endpoint: process.core_env.NLU_ENDPOINT!, cloud: botConfig.cloud })
    this._clientPerBot[botId] = client
  }

  public unmountBot(botId: string) {
    delete this._clientPerBot[botId]
  }
}
