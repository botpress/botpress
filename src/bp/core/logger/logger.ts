import { Level, LogEntry, Logger } from 'botpress-module-sdk'
import chalk from 'chalk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import util from 'util'

import { TYPES } from '../misc/types'

import { LoggerPersister } from '.'

export type LoggerProvider = (module: string) => Promise<Logger>

@injectable()
// Suggestion: Would be best to have a CompositeLogger that separates the Console and DB loggers
export class PersistedConsoleLogger implements Logger {
  private botId: string | undefined

  constructor(
    @inject(TYPES.Logger_Name) private name: string,
    @inject(TYPES.IsProduction) private isProduction: boolean,
    @inject(TYPES.LoggerPersister) private loggerPersister: LoggerPersister
  ) {}

  forBot(botId: string): this {
    this.botId = botId
    return this
  }

  private print(level: Level, message: string, metadata: any) {
    const args = {
      botId: this.botId,
      level: level.name,
      scope: this.name,
      message: message,
      metadata: metadata,
      timestamp: moment().toISOString()
    }
    const entry = new LogEntry(args)
    this.loggerPersister.appendLog(entry)

    const serializedMetadata = metadata ? ' | ' + util.inspect(metadata, false, 2, true) : ''
    const time = moment().format('HH:mm:ss.SSS')

    console.log(chalk`{grey ${time}} {${level.color}.bold ${this.name}} ${message}${serializedMetadata}`)
    this.botId = undefined
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
