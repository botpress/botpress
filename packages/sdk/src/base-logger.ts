import util from 'util'

type LogLevel = 'info' | 'debug' | 'warn' | 'error'

export abstract class BaseLogger<TOptions extends object> {
  protected defaultOptions: TOptions

  protected constructor(defaultOptions: TOptions) {
    this.defaultOptions = defaultOptions
  }

  public abstract with(options: TOptions): BaseLogger<TOptions>

  public info(...args: Parameters<typeof console.info>) {
    this._log('info', args)
  }

  public debug(...args: Parameters<typeof console.debug>) {
    this._log('debug', args)
  }

  public warn(...args: Parameters<typeof console.warn>) {
    this._log('warn', args)
  }

  public error(...args: Parameters<typeof console.error>) {
    this._log('error', args)
  }

  private _log(level: LogLevel, args: Parameters<typeof console.info>) {
    this._getConsoleMethod(level)(this._serializeMessage(args))
  }

  private _serializeMessage(args: Parameters<typeof console.info>) {
    const msg = util.format(...args)
    if (process.env['BP_LOG_FORMAT'] === 'json') {
      return this.getJsonMessage(msg)
    } else {
      return msg
    }
  }

  protected getJsonMessage(msg: string) {
    return JSON.stringify({ msg, options: this.defaultOptions })
  }

  private _getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'debug':
        return console.debug
      case 'warn':
        return console.warn
      case 'error':
        return console.error
      default:
        return console.info
    }
  }
}
