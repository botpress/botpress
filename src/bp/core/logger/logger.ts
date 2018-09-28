import { Logger, LoggerEntry, LoggerLevel } from 'botpress/sdk'
import chalk from 'chalk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import os from 'os'
import util from 'util'

import { TYPES } from '../types'

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

  colors = {
    [LoggerLevel.Info]: 'green',
    [LoggerLevel.Warn]: 'yellow',
    [LoggerLevel.Error]: 'red',
    [LoggerLevel.Debug]: 'blue'
  }

  private print(level: LoggerLevel, message: string, metadata: any) {
    const entry: LoggerEntry = {
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

    const displayName = process.env.INDENT_LOGS ? this.name.substr(0, 15).padEnd(15, ' ') : this.name

    console.log(chalk`{grey ${time}} {${this.colors[level]}.bold ${displayName}} ${message}${serializedMetadata}`)
    this.botId = undefined
  }

  debug(message: string, metadata?: any): void {
    if (!this.isProduction) {
      this.print(LoggerLevel.Debug, message, metadata)
    }
  }

  info(message: string, metadata?: any): void {
    this.print(LoggerLevel.Info, message, metadata)
  }

  warn(message: string, metadata?: any): void {
    this.print(LoggerLevel.Warn, message, metadata)
  }

  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void {
    if (error instanceof Error) {
      let msg = message + ` [${error.name}, ${error.message}]`
      if (!this.isProduction && error.stack) {
        msg += chalk.grey(os.EOL + '----- STACK -----')
        msg += chalk.grey(os.EOL + error.stack)
      }

      return this.print(LoggerLevel.Error, msg, metadata)
    }

    this.print(LoggerLevel.Error, message, error)
  }
}
