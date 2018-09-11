import { Level, LogEntry, Logger } from 'botpress-module-sdk'
import chalk from 'chalk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import util from 'util'

import { TYPES } from '../misc/types'

import DBLogger from './db-logger'

export type LoggerProvider = (module: string) => Promise<Logger>

@injectable()
export default class ConsoleLogger implements Logger {
  constructor(
    @inject(TYPES.Logger_Name) private name: string,
    @inject(TYPES.IsProduction) private isProduction: boolean,
    @inject(TYPES.DbLogger) private dbLogger: DBLogger
  ) {}

  private print(level: Level, message: string, metadata: any) {
    const entry = new LogEntry(level.name, this.name, message, metadata, moment().toISOString())
    this.dbLogger.saveEntry(entry)

    const serializedMetadata = metadata ? ' | ' + util.inspect(metadata, false, 2, true) : ''
    const time = moment().format('HH:mm:ss.SSS')

    console.log(chalk`{grey ${time}} {${level.color}.bold ${this.name}} ${message}${serializedMetadata}`)
  }

  debug(message: string, metadata?: any): void {
    if (!this.isProduction) {
      this.print(Level.Debug, message, metadata)
    }
  }

  info(message: string, metadata?: any): void {
    this.print(Level.Info, message, metadata)
  }

  warn(message: string, metadata?: any): void {
    this.print(Level.Warn, message, metadata)
  }

  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void {
    if (error instanceof Error) {
      const msg = message + ` [${error.name}, ${error.message}]`
      return this.print(Level.Error, msg, metadata)
    }

    this.print(Level.Error, message, error)
  }
}
