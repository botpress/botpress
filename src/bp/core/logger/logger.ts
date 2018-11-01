import { Logger, LoggerEntry, LoggerLevel, LogLevel } from 'botpress/sdk'
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
  public readonly displayLevel: number
  private currentMessageLevel: LogLevel | undefined
  private willPersistMessage: boolean = true

  constructor(
    @inject(TYPES.Logger_Name) private name: string,
    @inject(TYPES.LoggerPersister) private loggerPersister: LoggerPersister
  ) {
    this.displayLevel = process.VERBOSITY_LEVEL
  }

  forBot(botId: string): this {
    this.botId = botId
    return this
  }

  attachError(error: Error): this {
    this.attachedError = error
    return this
  }

  persist(shouldPersist: boolean): this {
    this.willPersistMessage = shouldPersist
    return this
  }

  level(level: LogLevel): this {
    this.currentMessageLevel = level
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

    if (this.willPersistMessage) {
      this.loggerPersister.appendLog(entry)
    } else {
      // We reset it right away to prevent race conditions (since the persister might log a new message asynchronously)
      this.willPersistMessage = true
    }

    if (level === LoggerLevel.Error && this.attachedError) {
      message += ` [${this.attachedError.name}, ${this.attachedError.message}]`
    }

    if (this.attachedError && this.displayLevel >= 1 && this.attachedError.stack) {
      message += chalk.grey(os.EOL + '----- STACK -----')
      message += chalk.grey(os.EOL + this.attachedError.stack)
    }

    const serializedMetadata = metadata ? ' | ' + util.inspect(metadata, false, 2, true) : ''
    const timeFormat = 'HH:mm:ss.SSS'
    const time = moment().format(timeFormat)

    const displayName = process.env.INDENT_LOGS ? this.name.substr(0, 15).padEnd(15, ' ') : this.name
    const newLineIndent = chalk.dim(' '.repeat(`${timeFormat} ${displayName}`.length)) + ' '
    const indentedMessage = level === LoggerLevel.Error ? message : message.replace(/\r\n|\n/g, os.EOL + newLineIndent)

    if (this.displayLevel >= (this.currentMessageLevel! || 0)) {
      console.log(
        chalk`{grey ${time}} {${this.colors[level]}.bold ${displayName}} ${indentedMessage}${serializedMetadata}`
      )
    }

    this.currentMessageLevel = undefined
    this.botId = undefined
    this.attachedError = undefined
  }

  debug(message: string, metadata?: any): void {
    if (this.currentMessageLevel === undefined) {
      this.currentMessageLevel = LogLevel.DEV
    }

    this.print(LoggerLevel.Debug, message, metadata)
  }

  info(message: string, metadata?: any): void {
    if (this.currentMessageLevel === undefined) {
      this.currentMessageLevel = LogLevel.PRODUCTION
    }

    this.print(LoggerLevel.Info, message, metadata)
  }

  warn(message: string, metadata?: any): void {
    if (this.currentMessageLevel === undefined) {
      this.currentMessageLevel = LogLevel.PRODUCTION
    }

    this.print(LoggerLevel.Warn, message, metadata)
  }

  error(message: string, metadata?: any): void {
    if (this.currentMessageLevel === undefined) {
      this.currentMessageLevel = LogLevel.PRODUCTION
    }

    this.print(LoggerLevel.Error, message, metadata)
  }
}
