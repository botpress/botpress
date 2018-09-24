import chalk from 'chalk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import util from 'util'

import { TYPES } from '../types'

import { LoggerPersister } from '.'
import { Logging } from 'bp/common'

export type LoggerProvider = (module: string) => Promise<Logging.Logger>

@injectable()
// Suggestion: Would be best to have a CompositeLogger that separates the Console and DB loggers
export class PersistedConsoleLogger implements Logging.Logger {
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

  colors = {
    [Logging.Level.Info]: 'green',
    [Logging.Level.Warn]: 'yellow',
    [Logging.Level.Error]: 'red',
    [Logging.Level.Debug]: 'blue'
  }

  private print(level: Logging.Level, message: string, metadata: any) {
    const entry: Logging.LogEntry = {
      botId: this.botId,
      level: level.toString(),
      scope: this.name,
      message: message,
      metadata: metadata,
      timestamp: moment().toISOString()
    }

    this.loggerPersister.appendLog(entry)

    const serializedMetadata = metadata ? ' | ' + util.inspect(metadata, false, 2, true) : ''
    const time = moment().format('HH:mm:ss.SSS')

    console.log(chalk`{grey ${time}} {${this.colors[level]}.bold ${this.name}} ${message}${serializedMetadata}`)
    this.botId = undefined
  }

  debug(message: string, metadata?: any): void {
    if (!this.isProduction) {
      this.print(Logging.Level.Debug, message, metadata)
    }
  }

  info(message: string, metadata?: any): void {
    this.print(Logging.Level.Info, message, metadata)
  }

  warn(message: string, metadata?: any): void {
    this.print(Logging.Level.Warn, message, metadata)
  }

  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void {
    if (error instanceof Error) {
      const msg = message + ` [${error.name}, ${error.message}]`
      return this.print(Logging.Level.Error, msg, metadata)
    }

    this.print(Logging.Level.Error, message, error)
  }
}
