import { inject, injectable } from 'inversify'

import { ConfigProvider } from '../config/config-loader'
import { TYPES } from '../types'

export interface BotRepository {
  getBotById(id: string): Promise<any>
}

@injectable()
export class GhostBotRepository implements BotRepository {
  constructor(@inject(TYPES.ConfigProvider) private configProvider: ConfigProvider) {}

  async getBotById(id: string) {
    const bot = await this.configProvider.getBotConfig(id)
    return { ...bot, id }
  }
}
