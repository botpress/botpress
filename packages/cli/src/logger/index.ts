/* eslint-disable no-console */
import { cursorTo, clearLine } from 'readline'
import { BaseLogger, LoggerOptions } from './base-logger'

export class Logger extends BaseLogger {
  private static _previousLine: SingleLineLogger | undefined // this is global to the whole process

  protected print(message: string, props: Partial<{ prefix: string; stderr?: boolean }> = {}): void {
    this.cleanup()
    const stream = props.stderr ? process.stderr : process.stdout
    const { prefix } = props
    if (prefix) {
      this.render(`${prefix} ${message}\n`, stream)
      return
    }
    this.render(`${message}\n`, stream)
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

  protected print(message: string, props: Partial<{ prefix: string }> = {}): void {
    if (this._commited) {
      return
    }

    clearLine(process.stdout, 0)
    const { prefix } = props
    cursorTo(process.stdout, 0)
    if (prefix) {
      this.render(`${prefix} ${message}`)
      return
    }
    this.render(message)
  }
}
