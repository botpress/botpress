import { Logger } from 'botpress-module-sdk'
import { inject, injectable, postConstruct } from 'inversify'
import { findIndex } from 'lodash'
import moment from 'moment'
import ms from 'ms'
import nanoid from 'nanoid'

import { ConfigProvider } from '../../config/config-loader'
import Database from '../../database'
import { TYPES } from '../../misc/types'

const DEFAULTS = {
  timestampColumn: 'created_on'
}

@injectable()
export class JanitorRunner {
  protected defaultJanitorInterval!: number
  protected defaultTimeoutInterval!: number

  private tasks: any = []
  private currentPromise
  private intervalRef

  constructor(
    @inject(TYPES.Logger) protected logger: Logger,
    @inject(TYPES.Database) protected database: Database,
    @inject(TYPES.ConfigProvider) protected configProvider: ConfigProvider
  ) {}

  @postConstruct()
  async initialize() {
    const config = await this.configProvider.getBotpressConfig()
    this.defaultJanitorInterval = ms(config.dialog.janitorInterval)
    this.defaultTimeoutInterval = ms(config.dialog.timeoutInterval)
  }

  protected async runTask(table, timestampColumn): Promise<void> {
    this.logger.debug(`Running for table ${table}`)
    const outdatedCondition = this.database.knex.date.isBefore(
      timestampColumn,
      moment()
        .subtract(this.defaultTimeoutInterval, 'ms')
        .toDate()
    )
    await this.database
      .knex(table)
      .where(outdatedCondition)
      .del()
      .then()
  }

  private runTasks() {
    this.logger.debug('Running tasks')
    if (this.currentPromise) {
      // don't run the tasks if the previous batch didn't finish yet
      this.logger.debug('Skipping the current run, previous operation still running')
      return
    }
    this.currentPromise = Promise.each(this.tasks, this.runTask)
      .catch(err => {
        this.logger.error('Error:', err.message)
      })
      .finally(() => {
        this.currentPromise = undefined
      })
  }

  start() {
    if (this.intervalRef) {
      return
    }
    this.intervalRef = setInterval(this.runTasks, this.defaultJanitorInterval)
    this.logger.info('Started')
  }

  add(options) {
    this.logger.debug(`Added table "${options.table}"`)
    const id = nanoid()
    this.tasks.push({ id, DEFAULTS, options })
    return id
  }

  remove(id) {
    const i = findIndex(this.tasks, { id })
    if (i < 0) {
      this.logger.error(`Unknown task ID "${id}"`)
      return
    }
    const [{ table }] = this.tasks.splice(i, 1)
    this.logger.debug(`Removed table "${table}"`)
  }

  stop() {
    clearInterval(this.intervalRef)
    this.intervalRef = undefined
    this.logger.info('Stopped')
  }
}
