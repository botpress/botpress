/* eslint-disable no-console */
import { cursorTo, clearLine } from 'readline'
import { BaseLogger, LoggerOptions } from './base-logger'

export class Logger extends BaseLogger {
  private static _previousLine: SingleLineLogger | undefined // this is global to the whole process

  protected print(message: string, props: Partial<{ metadata: any; prefix: string; stderr?: boolean }> = {}): void {
    this.cleanup()
    const log = props.stderr ? console.error : console.info
    const { metadata, prefix } = props
    if (prefix) {
      log(prefix, message, metadata ?? '')
      return
    }
    log(message, metadata ?? '')
  }

  public line(): SingleLineLogger {
    this.cleanup()
    const currentLine = new SingleLineLogger({ ...this.opts })
    Logger._previousLine = currentLine
    return currentLine
  }

  public cleanup(): void {
    if (Logger._previousLine) {
      Logger._previousLine.commit()
      Logger._previousLine = undefined
    }
  }
}

class SingleLineLogger extends BaseLogger {
  private _commited = false

  constructor(opts: LoggerOptions) {
    super(opts)
  }

  public commit(): void {
    if (this._commited) {
      return
    }
    this._commited = true
    console.log()
  }

  protected print(message: string, props: Partial<{ metadata: any; prefix: string }> = {}): void {
    if (this._commited) {
      return
    }

    clearLine(process.stdout, 0)
    const { metadata, prefix } = props
    cursorTo(process.stdout, 0)
    if (prefix) {
      process.stdout.write(`${prefix} ${message} ${metadata ?? ''}`)
      return
    }
    process.stdout.write(`${message} ${metadata ?? ''}`)
  }
}
