import { Bot } from './scoped/bot'
import { TrainerService } from './typings'

export class BotService implements TrainerService {
  private _bots: { [botId: string]: Bot } = {}

  getIds() {
    return Object.keys(this._bots)
  }

  setBot(botId: string, bot: Bot) {
    this._bots[botId] = bot
  }

  getBot(botId: string): Bot | undefined {
    return this._bots[botId]
  }

  removeBot(botId: string): void {
    delete this._bots[botId]
  }
}
