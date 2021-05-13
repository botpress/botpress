import ms from 'ms'
import { NLUApplication } from '.'
import { BotConfig } from './typings'

const STAN_POLLING_INTERVAL = ms('1s')

export class NonBlockingNluApplication extends NLUApplication {
  private _waitingBots: BotConfig[] = []
  private _stanIsReady = false

  public async initialize() {
    await this._waitForStan()
    this._stanIsReady = true
    while (this._waitingBots.length) {
      const bot = this._waitingBots.pop()!
      await super.mountBot(bot)
    }
    await this.resumeTrainings()
  }

  public async mountBot(botConfig: BotConfig) {
    if (this._stanIsReady) {
      return super.mountBot(botConfig)
    }
    this._waitingBots.push(botConfig)
  }

  private _waitForStan() {
    return new Promise(resolve => {
      const i = setInterval(async () => {
        const health = await this.getHealth()
        if (health?.isEnabled) {
          clearInterval(i)
          resolve()
          return
        }
      }, STAN_POLLING_INTERVAL)
    })
  }
}
