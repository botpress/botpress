export interface LogEntry {
  botId?: string
  level: string
  scope: string
  message: string
  metadata: any
  timestamp: string
}

export enum Level {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug'
}

export interface Logger {
  forBot(botId: string): this
  debug(message: string, metadata?: any): void
  info(message: string, metadata?: any): void
  warn(message: string, metadata?: any): void
  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void
}
