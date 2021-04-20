import Logger from './index'

class DebugLogger extends Function {
  public enabled = true
  private _logger: Logger
  private _bound: any
  private _nsLoggers = new Map<string, DebugLogger>()

  constructor(private _name: string) {
    super()
    this._logger = new Logger(_name)
  }

  _call(msg: string, extra?: any) {
    this._logger.debug(msg, extra)
  }

  forBot(botId: string, message: string, extra?: any): void {
    this._logger.forBot(botId).debug(message, extra)
  }

  sub(namespace: string): DebugLogger {
    if (this._nsLoggers.has(namespace)) {
      return this._nsLoggers.get(namespace)!
    }
    const logger = new DebugLogger(`${this._name}:${namespace}`)
    this._nsLoggers.set(namespace, logger)
    return logger
  }
}

const rootDebugLogger = new DebugLogger('debug')

const DEBUG = (module: string, botId?: string) => rootDebugLogger.sub(module)

export default DEBUG
