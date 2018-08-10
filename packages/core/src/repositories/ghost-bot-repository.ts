import { inject, injectable } from 'inversify'

import { ConfigProvider } from '../config/config-loader'
import { TYPES } from '../misc/types'

import { BotRepository } from './bot-repository'

@injectable()
export class GhostBotRepository implements BotRepository {
  constructor(@inject(TYPES.ConfigProvider) private configProvider: ConfigProvider) {}

  async getBotById(id: string) {
    const bot = this.configProvider.getBotConfig(id)
    return { ...bot, id }
  }
}
