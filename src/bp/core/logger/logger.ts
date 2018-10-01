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
  private attachedError: Error | undefined

  constructor(
    @inject(TYPES.Logger_Name) private name: string,
    @inject(TYPES.IsProduction) private isProduction: boolean,
    @inject(TYPES.LoggerPersister) private loggerPersister: LoggerPersister
  ) {}

  forBot(botId: string): this {
    this.botId = botId
    return this
  }

  attachError(error: Error): this {
    this.attachedError = error
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

    if (level === LoggerLevel.Error && this.attachedError) {
      message += ` [${this.attachedError.name}, ${this.attachedError.message}]`
      if (!this.isProduction && this.attachedError.stack) {
        message += chalk.grey(os.EOL + '----- STACK -----')
        message += chalk.grey(os.EOL + this.attachedError.stack)
      }
    }

    const serializedMetadata = metadata ? ' | ' + util.inspect(metadata, false, 2, true) : ''
    const timeFormat = 'HH:mm:ss.SSS'
    const time = moment().format(timeFormat)

    const displayName = process.env.INDENT_LOGS ? this.name.substr(0, 15).padEnd(15, ' ') : this.name
    const newLineIndent = chalk.dim(' '.repeat(`${timeFormat} ${displayName}`.length)) + ' '
    const indentedMessage =
      level === LoggerLevel.Error ? message : message.replace(new RegExp(os.EOL, 'g'), os.EOL + newLineIndent)

    console.log(
      chalk`{grey ${time}} {${this.colors[level]}.bold ${displayName}} ${indentedMessage}${serializedMetadata}`
    )
    this.botId = undefined
    this.attachedError = undefined
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

  error(message: string, metadata?: any): void {
    this.print(LoggerLevel.Error, message, metadata)
  }
}
