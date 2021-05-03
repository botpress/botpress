import { Logger } from 'botpress/sdk'
import { injectable } from 'inversify'
import ms from 'ms'

@injectable()
export abstract class Janitor {
  protected runningInterval!: string

  private currentPromise
  private intervalRef

  constructor(protected logger: Logger) {}

  protected abstract getInterval(): Promise<string>

  abstract runTask(): Promise<void>

  private runTaskWhenReady = () => {
    if (this.currentPromise) {
      this.logger.debug('Skipping the current run, previous operation still running')
      return
    }
    this.currentPromise = this.runTask()
      .catch((err: Error) => {
        this.logger.warn('Error running task: ' + err && err.message)
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
      throw new Error('The Janitor is already started')
    }

    this.intervalRef = setInterval(this.runTaskWhenReady.bind(this), ms(this.runningInterval))
  }

  stop() {
    clearInterval(this.intervalRef)
    this.intervalRef = undefined
    this.logger.info('Stopped')
  }
}
