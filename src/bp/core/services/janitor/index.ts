import { injectable } from 'inversify'
import ms from 'ms'
import { Logging } from 'bp/common'

@injectable()
export abstract class Janitor {
  protected runningInterval!: string

  private currentPromise
  private intervalRef

  constructor(protected logger: Logging.Logger) {}

  protected abstract getInterval(): Promise<string>

  protected abstract async runTask(): Promise<void>

  private runTaskWhenReady = () => {
    if (this.currentPromise) {
      this.logger.debug('Skipping the current run, previous operation still running')
      return
    }
    this.currentPromise = this.runTask()
      .catch(err => {
        this.logger.error('Error running task', err)
      })
      .finally(() => {
        this.currentPromise = undefined
      })
  }

  async start() {
    this.runningInterval = await this.getInterval()

    if (!this.runningInterval) {
      throw new Error('A running interval has to be set before starting the janitor')
    }

    if (this.intervalRef) {
      throw new Error(`The Janitor is already started`)
    }

    this.intervalRef = setInterval(this.runTaskWhenReady.bind(this), ms(this.runningInterval))
    this.logger.info('Started')
  }

  stop() {
    clearInterval(this.intervalRef)
    this.intervalRef = undefined
    this.logger.info('Stopped')
  }
}
