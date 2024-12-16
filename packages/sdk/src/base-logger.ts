import util from 'util'

type LogLevel = 'info' | 'debug' | 'warn' | 'error'

export abstract class BaseLogger<TOptions extends object> {
  protected defaultOptions: TOptions

  protected constructor(defaultOptions: TOptions) {
    this.defaultOptions = defaultOptions
  }

  public abstract with(options: TOptions): BaseLogger<TOptions>

  public info(...args: Parameters<typeof console.info>) {
    this.log('info', args)
  }

  public debug(...args: Parameters<typeof console.debug>) {
    this.log('debug', args)
  }

  public warn(...args: Parameters<typeof console.warn>) {
    this.log('warn', args)
  }

  public error(...args: Parameters<typeof console.error>) {
    this.log('error', args)
  }

  private log(level: LogLevel, args: Parameters<typeof console.info>) {
    this.getConsoleMethod(level)(this.serializeMessage(args))
  }

  private serializeMessage(args: Parameters<typeof console.info>) {
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

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'debug':
        return console.debug
      case 'warn':
        return console.warn
      case 'error':
        return console.error
      case 'info':
        return console.info
    }
  }
}
