import { Logger, LoggerEntry } from 'botpress/sdk'
import { injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import ms from 'ms'

import Database from '../database'

@injectable()
export class LoggerDbPersister {
  private readonly BATCH_SIZE = 100
  private readonly TABLE_NAME = 'srv_logs'
  private readonly INTERVAL = ms('2s')

  private knex!: Knex
  private batch: LoggerEntry[] = []
  private intervalRef
  private currentPromise
  private logger!: Logger

  constructor() {}

  async initialize(database: Database, logger: Logger) {
    this.knex = database.knex
    this.logger = logger
  }

  appendLog(log: LoggerEntry) {
    this.batch.push(log)
  }

  start() {
    this.validateInit()

    if (this.intervalRef) {
      return
    }
    this.intervalRef = setInterval(this.runTask, this.INTERVAL)
  }

  stop() {
    clearInterval(this.intervalRef)
    this.intervalRef = undefined
    this.logger.info('Stopped')
  }

  private validateInit() {
    if (!this.knex) {
      throw new Error('The database is not initialized. You have to call initialize() first.')
    }

    if (!this.logger) {
      throw new Error('Required a logger instance')
    }
  }

  private runTask = async () => {
    if (process.env.DEBUG_LOGGER) {
      this.logger.debug(`Saving ${this.batch.length} logs`)
    }

    if (this.currentPromise || this.batch.length === 0) {
      return
    }

    this.currentPromise = this.knex
      .batchInsert(this.TABLE_NAME, this.batch, this.BATCH_SIZE)
      .then(() => {
        if (this.batch.length >= this.BATCH_SIZE) {
          this.batch.splice(0, this.BATCH_SIZE)
        } else {
          this.batch.splice(0, this.batch.length)
        }
      })
      .catch(err =>
        this.logger
          .attachError(err)
          .persist(false)
          .error('Error persisting messages')
      )
      .finally(() => {
        this.currentPromise = undefined
      })
  }
}
