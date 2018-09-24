import * as Users from './users'
import * as IO from './io'
import * as RealTime from './realtime'
import { Logger } from './logging'

import { Request, Router } from 'express'
import Knex from 'knex'

export interface RealTimeAPI {
  sendPayload(payload: RealTime.Payload)
}

export type SubRouter = Router

export type RouterCondition = boolean | ((req: Request) => boolean)

export type RouterOptions = {
  checkAuthentication: RouterCondition
  enableJsonBodyParser: RouterCondition
}

export interface HttpAPI {
  createShortLink(): void
  createRouterForBot(routerName: string, options?: RouterOptions): SubRouter
}

export interface EventAPI {
  registerMiddleware(middleware: IO.MiddlewareDefinition): void
  sendEvent(event: IO.Event): void
}

export interface UserAPI {
  getOrCreateUser(channelName: string, userId: string): Knex.GetOrCreateResult<Users.User>
  updateAttributes(channel: string, id: string, attributes: Users.Attribute[]): Promise<void>
}

export interface DialogAPI {
  processMessage(userId: string, event: IO.Event): Promise<void>
  deleteSession(userId: string): Promise<void>
  getState(userId: string): Promise<void>
  setState(userId: string, state: any): Promise<void>
}

export interface ConfigAPI {
  getModuleConfig(moduleId: string): Promise<any>
  getModuleConfigForBot(moduleId: string, botId: string): Promise<any>
}

export default interface CoreSDK {
  http: HttpAPI
  events: EventAPI
  logger: Logger
  dialog: DialogAPI
  config: ConfigAPI
  database: Knex
  users: UserAPI
  realtime: RealTimeAPI
}
