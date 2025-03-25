import { BaseLogger, StreamType } from './base-logger'

export class Logger extends BaseLogger {
  private static _previousLine: _SingleLineLogger | undefined // this is global to the whole process

  protected print(message: string, props: Partial<{ prefix: string; stderr?: boolean }> = {}): void {
    this.cleanup()
    const stream: StreamType = props.stderr ? 'err' : 'out'
    const { prefix } = props
    if (prefix) {
      this.render(`${prefix} ${message}\n`, stream)
      return
    }
    this.render(`${message}\n`, stream)
  }

  public line(): _SingleLineLogger {
    this.cleanup()
    const currentLine = new _SingleLineLogger({ ...this.opts })
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

/**
 * Prints to a single line unless it is committed.
 * When committed or if the stream is not TTY, it prints normally using new lines.
 */
class _SingleLineLogger extends BaseLogger {
  private _commited = false

  public commit(): void {
    if (this._commited) {
      return
    }
    this._commited = true
    this.print('')
  }

  protected print(message: string, props: Partial<{ prefix: string }> = {}): void {
    let suffix: string
    if (!this._commited && process.stdout.isTTY) {
      this.opts.outStream.clearLine(0)
      this.opts.outStream.cursorTo(0)
      suffix = ''
    } else {
      suffix = '\n'
    }

    const { prefix } = props
    if (prefix) {
      this.render(`${prefix} ${message}${suffix}`)
      return
    }
    this.render(message + suffix)
  }
}
