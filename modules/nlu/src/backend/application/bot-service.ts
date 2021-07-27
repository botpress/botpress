import { IBot } from './scoped/bot'
import { TrainerService, I } from './typings'

export type IBotService = I<BotService>

export class BotService implements TrainerService {
  private _bots: { [botId: string]: IBot } = {}

  hasBot(botId: string): boolean {
    return !!this.getBot(botId)
  }

  getIds() {
    return Object.keys(this._bots)
  }

  setBot(botId: string, bot: IBot) {
    this._bots[botId] = bot
  }

  getBot(botId: string): IBot | undefined {
    return this._bots[botId]
  }

  removeBot(botId: string): void {
    delete this._bots[botId]
  }
}
