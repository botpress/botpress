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

class _SingleLineLogger extends BaseLogger {
  private _commited = false

  public commit(): void {
    if (this._commited) {
      return
    }
    this._commited = true
    this.render('\n')
  }

  protected print(message: string, props: Partial<{ prefix: string }> = {}): void {
    if (this._commited) {
      return
    }

    this.opts.outStream.clearLine(0)
    const { prefix } = props
    this.opts.outStream.cursorTo(0)

    if (prefix) {
      this.render(`${prefix} ${message}`)
      return
    }
    this.render(message)
  }
}
