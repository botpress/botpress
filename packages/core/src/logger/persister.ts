import { ExtendedKnex, LogEntry } from 'botpress-module-sdk'
import chalk from 'chalk'
import { injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { DatabaseConfig } from '../config/botpress.config'
import { patchKnex } from '../database/helpers'
import LogsTable from '../database/tables/server-wide/logs'

@injectable()
export class LoggerPersister {
  private readonly BATCH_SIZE = 100
  private readonly TABLE_NAME = 'srv_logs'

  private knex!: ExtendedKnex
  private batch: LogEntry[] = []
  private intervalRef
  private currentPromise

  async initialize(dbConfig: DatabaseConfig) {
    const config: Knex.Config = {
      useNullAsDefault: true
    }

    if (dbConfig.type.toLowerCase() === 'postgres') {
      Object.assign(config, {
        client: 'pg',
        connection: dbConfig.url || _.pick(dbConfig, ['host', 'port', 'user', 'password', 'database', 'ssl'])
      })
    } else {
      Object.assign(config, {
        client: 'sqlite3',
        connection: { filename: dbConfig.location }
      })
    }

    this.knex = patchKnex(await Knex(config))
    const table = new LogsTable(this.knex!)
    const created = await table.bootstrap()
    if (created) {
      this.log(`Created table '${table.name}'`)
    }
  }

  saveEntry(log: LogEntry) {
    this.batch.push(log)
  }

  start() {
    this.validateInit()
    this.log('Started')

    if (this.intervalRef) {
      return
    }
    this.intervalRef = setInterval(() => this.runTask(), ms('2s'))
  }

  stop() {
    clearInterval(this.intervalRef)
    this.intervalRef = undefined
    this.log('Stopped')
  }

  private log(message: string) {
    const time = moment().format('HH:mm:ss.SSS')
    console.log(chalk`{grey ${time}} {white.bold LogPersister} ${message}`)
  }

  private validateInit() {
    if (!this.knex) {
      throw new Error('The database is not initialized. You have to call initialize() first.')
    }
  }

  private async runTask(): Promise<void> {
    // this.log(`Saving ${this.batch.length} logs`)

    if (this.currentPromise) {
      return
    }
    this.currentPromise = this.knex
      .batchInsert(this.TABLE_NAME, this.batch, this.BATCH_SIZE)
      .then()
      .catch(err => this.log('Error:' + err.message))
      .finally(() => {
        this.currentPromise = undefined
      })
      .then(() => {
        if (this.batch.length >= this.BATCH_SIZE) {
          this.batch.splice(0, this.BATCH_SIZE)
        } else {
          this.batch.splice(0, this.batch.length)
        }
      })
  }
}
