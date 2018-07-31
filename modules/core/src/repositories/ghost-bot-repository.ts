import { inject, injectable } from 'inversify'

import { BotConfig } from '../config/bot.config'
import { TYPES } from '../misc/types'
import { GhostContentService } from '../services/ghost-content'

import { BotRepository } from './bot-repository'

@injectable()
export class GhostBotRepository implements BotRepository {
  constructor(@inject(TYPES.GhostService) private ghostSvc: GhostContentService) {
    this.ghostSvc.addRootFolder(false, '/', { filesGlob: 'bot.config.json', isBinary: false })
  }

  async getBotById(id: string) {
    const content = <string>await this.ghostSvc.readFile(id, '/', 'bot.config.json')
    const bot = <BotConfig>JSON.parse(content)
    return { ...bot, id }
  }
}
