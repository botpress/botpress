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
  id?: string
  bot?: {
    id?: string
    botId?: string
  }
  botId?: string
  user?: {
    id?: string
    userId?: string
  }
  userId?: string
  raw?: BotpressEvent
}
