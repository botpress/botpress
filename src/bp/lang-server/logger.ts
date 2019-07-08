import chalk from 'chalk'
import moment from 'moment'
import os from 'os'
import util from 'util'

import { LoggerLevel, LogLevel } from '../core/sdk/enums'

export class LangServerLogger {
  private attachedError: Error | undefined
  public readonly displayLevel: number
  private currentMessageLevel: LogLevel | undefined

  constructor(private name: string) {
    this.displayLevel = process.VERBOSITY_LEVEL || 0
  }

  attachError(error: Error): this {
    this.attachedError = error
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
    const serializedMetadata = metadata ? util.inspect(metadata, false, 2, true) : ''
    const timeFormat = 'HH:mm:ss.SSS'
    const time = moment().format(timeFormat)

    const displayName = process.env.INDENT_LOGS ? this.name.substr(0, 15).padEnd(15, ' ') : this.name
    const newLineIndent = chalk.dim(' '.repeat(`${timeFormat} ${displayName}`.length)) + ' '
    let indentedMessage = level === LoggerLevel.Error ? message : message.replace(/\r\n|\n/g, os.EOL + newLineIndent)

    if (
      this.attachedError &&
      this.displayLevel >= LogLevel.DEV &&
      this.attachedError.stack &&
      this.attachedError['__hideStackTrace'] !== true
    ) {
      indentedMessage += chalk.grey(os.EOL + 'STACK TRACE')
      indentedMessage += chalk.grey(os.EOL + this.attachedError.stack)
    }

    if (this.displayLevel >= this.currentMessageLevel!) {
      console.log(
        chalk`{grey ${time}} {${this.colors[level]}.bold ${displayName}} ${indentedMessage}${serializedMetadata}`
      )
    }

    this.currentMessageLevel = undefined
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
