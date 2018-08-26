import { BotpressEvent, MiddlewareDefinition } from '.'
import { ChannelUser, ChannelUserAttribute } from './user'

export interface HttpAPI {
  createShortLink(): void
}

export interface EventAPI {
  registerMiddleware(middleware: MiddlewareDefinition): void
  sendEvent(event: BotpressEvent): void
}

export interface UserAPI {
  getUser(channelName: string, userId: string): Promise<ChannelUser>
  createUser(channelName: string, userId: string): Promise<void>
  updateUserAttributes(channelName: string, userId: string, attributes: ChannelUserAttribute[]): Promise<void>
}

export interface Logger {
  debug(message: string, metadata?: any): void
  info(message: string, metadata?: any): void
  warn(message: string, metadata?: any): void
  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void
}

export type LoggerAPI = Logger

// users_channels
// users_profile
// users_bots
// users_channels_merges

export type BotpressAPI = {
  http: HttpAPI
  events: EventAPI
  logger: LoggerAPI
  dialog: any // TODO
}
