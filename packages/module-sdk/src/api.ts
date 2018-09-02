import { BotpressEvent, MiddlewareDefinition } from '.'
import { ExtendedKnex, GetOrCreateResult } from './database'
import { HttpAPI } from './http'
import { ChannelOutgoingHandler } from './module'
import { RealTimeAPI } from './realtime'
import { ChannelUser, ChannelUserAttribute } from './user'

export interface EventAPI {
  registerMiddleware(middleware: MiddlewareDefinition): void
  sendEvent(event: BotpressEvent): void
  registerOutgoingChannelHandler(channelHandler: ChannelOutgoingHandler): void
}

export interface UserAPI {
  getOrCreateUser(channelName: string, userId: string): GetOrCreateResult<ChannelUser>
  updateAttributes(channel: string, id: string, attributes: ChannelUserAttribute[]): Promise<void>
}

export interface DialogAPI {
  processMessage(userId: string, event: BotpressEvent): Promise<void>
}

export interface Logger {
  debug(message: string, metadata?: any): void
  info(message: string, metadata?: any): void
  warn(message: string, metadata?: any): void
  error(message: string, metadata?: any): void
  error(message: string, error: Error, metadata?: any): void
}

export interface ConfigAPI {
  getModuleConfig(moduleId: string): Promise<any>
  getModuleConfigForBot(moduleId: string, botId: string): Promise<any>
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
  dialog: DialogAPI
  config: ConfigAPI
  database: ExtendedKnex
  users: UserAPI
  realtime: RealTimeAPI
}
