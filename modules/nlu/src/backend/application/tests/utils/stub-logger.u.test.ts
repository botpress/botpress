import * as sdk from 'botpress/sdk'

import './sdk.u.test'

export class StubLogger implements sdk.Logger {
  forBot(botId: string): this {
    return this
  }
  attachError(error: Error): this {
    return this
  }
  attachEvent(event: sdk.IO.Event): this {
    return this
  }
  persist(shouldPersist: boolean): this {
    return this
  }
  level(level: sdk.LogLevel): this {
    return this
  }
  noEmit(): this {
    return this
  }
  debug(message: string, metadata?: any): void {}
  info(message: string, metadata?: any): void {}
  warn(message: string, metadata?: any): void {}
  error(message: string, metadata?: any): void {}
  critical(message: string, metadata?: any): void {}
}
