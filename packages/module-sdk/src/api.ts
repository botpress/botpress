import { BotpressEvent, MiddlewareDefinition } from '.'
import { ChannelUser, ChannelUserAttribute } from './user'

export type HttpAPI = {
  createShortLink(): void // TODO
}

export type EventAPI = {
  register(middleware: MiddlewareDefinition): void
  sendIncoming(event: BotpressEvent): void
  sendOutgoing(event: BotpressEvent): void
}

export type UserAPI = {
  // TODO
  getUser(channelName: string, userId: string): Promise<ChannelUser>
  createUser(channelName: string, userId: string): Promise<void>
  updateUserAttributes(channelName: string, userId: string, attributes: ChannelUserAttribute[]): Promise<void>
}

// users_channels
// users_profile
// users_bots
// users_channels_merges

export type BotpressAPI = {
  http: HttpAPI
}
