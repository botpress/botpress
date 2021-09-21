import { ConfigProvider } from 'core/config'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import { NLUClient } from './client'

@injectable()
export class NLUClientProvider {
  private _endpoint: string | undefined
  private _baseClient: NLUClient | undefined
  private _clientPerBot: { [botId: string]: NLUClient } = {}

  constructor(@inject(TYPES.ConfigProvider) private configProvider: ConfigProvider) {}

  public getbaseClient(): NLUClient | undefined {
    return this._baseClient
  }

  public getClientForBot(botId: string): NLUClient | undefined {
    return this._clientPerBot[botId]
  }

  public async initialize() {
    const { nlu: nluConfig } = await this.configProvider.getBotpressConfig()
    const { autoStartNLUServer, nluServerEndpoint } = nluConfig

    const defaultEndpoint = `http://localhost:${process.NLU_PORT}`
    this._endpoint = autoStartNLUServer ? defaultEndpoint : nluServerEndpoint
    this._baseClient = new NLUClient({ endpoint: this._endpoint })
  }

  public async mountBot(botId: string) {
    if (!this._endpoint) {
      throw new Error('Class not initialized yet.')
    }

    const botConfig = await this.configProvider.getBotConfig(botId)

    const client = new NLUClient({ endpoint: this._endpoint, cloud: botConfig.cloud })
    this._clientPerBot[botId] = client
  }

  public unmountBot(botId: string) {
    delete this._clientPerBot[botId]
  }
}
