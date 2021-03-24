import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { LoggerLevel, LogLevel } from 'core/logger/enums'
import _ from 'lodash'
import moment from 'moment'
import os from 'os'
import util from 'util'

function _serializeArgs(args: any): string {
  if (_.isArray(args)) {
    return args.map(arg => _serializeArgs(arg)).join(', ')
  } else if (_.isObject(args)) {
    return util.inspect(args, false, 2, true)
  } else if (_.isString(args)) {
    return args.trim()
  } else if (args && args.toString) {
    return args.toString()
  } else {
    return ''
  }
}

export default class Logger implements sdk.Logger {
  private attachedError: Error | undefined
  public readonly displayLevel: number
  private currentMessageLevel: LogLevel | undefined
  private silent = false

  constructor(private name: string) {
    this.displayLevel = process.VERBOSITY_LEVEL || 0
  }

  public silence(): void {
    this.silent = true
  }

  forBot(botId: string): this {
    return this
  }

  attachEvent(event: sdk.IO.Event): this {
    return this
  }

  persist(shouldPersist: boolean): this {
    return this
  }

  noEmit(): this {
    return this
  }

  critical(message: string, metadata?: any): void {}

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
    const serializedMetadata = metadata ? _serializeArgs(metadata) : ''
    const timeFormat = 'L HH:mm:ss.SSS'
    const time = moment().format(timeFormat)

    const displayName = process.env.INDENT_LOGS ? this.name.substr(0, 15).padEnd(15, ' ') : this.name
    // eslint-disable-next-line prefer-template
    const newLineIndent = chalk.dim(' '.repeat(`${timeFormat} ${displayName}`.length)) + ' '
    let indentedMessage = level === LoggerLevel.Error ? message : message.replace(/\r\n|\n/g, os.EOL + newLineIndent)

    if (
      this.attachedError &&
      this.displayLevel >= LogLevel.DEV &&
      this.attachedError.stack &&
      this.attachedError['__hideStackTrace'] !== true
    ) {
      // eslint-disable-next-line prefer-template
      indentedMessage += chalk.grey(os.EOL + 'STACK TRACE')
      indentedMessage += chalk.grey(os.EOL + this.attachedError.stack)
    }

    if (this.displayLevel >= this.currentMessageLevel!) {
      !this.silent &&
        // eslint-disable-next-line no-console
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
