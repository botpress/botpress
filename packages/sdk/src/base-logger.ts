import util from 'util'

export type LogLevel = 'info' | 'debug' | 'warn' | 'error'

export type IssueLogEvent = {
  type: 'issue'
  code: string
  category: 'user_code' | 'limits' | 'configuration' | 'other'
  title: string
  description: string
  data: Record<string, { raw: string; pretty?: string }>
  /** This groups by data fields */
  groupBy: string[]
  traceId?: string
}

const LOG_LEVEL_RANKS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

let _hasWarnedAboutInvalidLogLevel = false

const _readConfiguredLogLevel = (): LogLevel | undefined => {
  const rawLogLevel = process.env['LOG_LEVEL']
  if (!rawLogLevel) {
    return undefined
  }

  const normalizedLogLevel = rawLogLevel.toLowerCase()
  if (_isLogLevel(normalizedLogLevel)) {
    return normalizedLogLevel
  }

  if (!_hasWarnedAboutInvalidLogLevel) {
    _hasWarnedAboutInvalidLogLevel = true
    console.warn(
      `Invalid LOG_LEVEL "${rawLogLevel}", expected one of: ${Object.keys(LOG_LEVEL_RANKS).join(', ')}. Logging is not filtered.`
    )
  }
  return undefined
}

const _isLogLevel = (value: string): value is LogLevel => Object.hasOwn(LOG_LEVEL_RANKS, value)

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

  public issue(args: IssueLogEvent) {
    console.info(JSON.stringify({ ...args, ...this.getIssueContext() }))
  }

  /**
   * Identity fields merged into every issue line so downstream ingestion can
   * attribute and validate the issue without out-of-band context.
   */
  protected getIssueContext(): Record<string, string> {
    return {}
  }

  private _log(level: LogLevel, args: Parameters<typeof console.info>) {
    if (!this._isLevelEnabled(level)) {
      return
    }
    this._getConsoleMethod(level)(this._serializeMessage(level, args))
  }

  private _isLevelEnabled(level: LogLevel): boolean {
    const configuredLogLevel = _readConfiguredLogLevel()
    return configuredLogLevel === undefined || LOG_LEVEL_RANKS[level] >= LOG_LEVEL_RANKS[configuredLogLevel]
  }

  private _serializeMessage(level: LogLevel, args: Parameters<typeof console.info>) {
    const msg = util.format(...args)
    if (process.env['BP_LOG_FORMAT'] === 'json') {
      return this.getJsonMessage(level, msg)
    } else {
      return msg
    }
  }

  protected getJsonMessage(level: LogLevel, msg: string) {
    return JSON.stringify({ msg, level, options: this.defaultOptions })
  }

  private _getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
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
