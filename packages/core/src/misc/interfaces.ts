export interface Logger {
  debug(message: string, metadata?: any): void
  info(message: string, metadata?: any): void
  warn(message: string, metadata?: any): void
  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void
}

export interface IDisposeOnExit {
  disposeOnExit(): void
}

export interface BotpressEvent {
  id?: string | number
  bot?: {
    id?: string | number
    botId?: string | number
  }
  botId?: string | number
  user?: {
    id?: string | number
    userId?: string | number
  }
  userId?: string | number
  raw?: BotpressEvent
}
