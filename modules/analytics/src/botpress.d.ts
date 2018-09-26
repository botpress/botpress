declare module 'botpress/sdk' {
  export const version: string

  export interface LoggerEntry {
    botId?: string
    level: string
    scope: string
    message: string
    metadata: any
    timestamp: string
  }

  export enum LoggerLevel {
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
    Debug = 'debug'
  }

  export const database: any

  export interface Logger {
    forBot(botId: string): this
    debug(message: string, metadata?: any): void
    info(message: string, metadata?: any): void
    warn(message: string, metadata?: any): void
    error(message: string, metadata?: any): void
    error(message: string, error: Error, metadata?: any): void
  }

  export interface ModuleDefinition {
    onInit: Function
    onReady: Function
    config: { [key: string]: ModuleConfigEntry }
    defaultConfigJson?: string
    serveFile?: ((path: string) => Promise<Buffer>)
  }

  export type ModuleConfigEntry = {
    type: 'bool' | 'any' | 'string'
    required: boolean
    default: any
    env?: string
  }

  export class RealTimePayload {
    readonly eventName: string
    readonly payload: any
    constructor(eventName: string, payload: any)
    public static forVisitor(visitorId: string, eventName: string, payload: any): RealTimePayload
  }

  export namespace IO {
    export type EventDirection = 'incoming' | 'outgoing'
    export namespace WellKnownFlags {
      export const SKIP_DIALOG_ENGINE: symbol
    }
    interface EventCtorArgs {
      id?: Number
      type: string
      channel: string
      target: string
      direction: EventDirection
      preview?: string
      payload: any
      threadId?: string
      botId: string
    }

    /**
     * @description
     * A BotpressEvent is how conversational channels interact with Botpress.  Events represent all the interactions
     * that make up a conversation.  That means the different message types (text, image, buttons, carousels etc) but also
     * the navigational events (chat open, user typing) and contextual events (user returned home, order delivered).
     * @property {string} type - The type of the event, i.e. image, text, timeout, etc
     * @property {string} channel - The channel of communication, i.e web, messenger, twillio
     * @property {string} target - Who will receive this message, usually a user's id
     * @property {EventDirection} direction – Is it (in)coming from the user to the bot or (out)going from the bot to the user?
     * @property {string} preview – A textual representation of the event
     * @property {string} [threadId] – The id of the thread this message is relating to (only on supported channels)
     * @property {string} botId – The id of the bot on which this event is relating to
     * @property {any} payload – The channel-specific raw payload
     */
    export interface Event {
      readonly id: Number
      readonly type: string
      readonly channel: string
      readonly target: string
      readonly direction: EventDirection
      readonly payload: any
      readonly botId: string
      readonly threadId?: string
      readonly preview: string
      hasFlag(flag: symbol): boolean
      setFlag(flag: symbol, value: boolean)
    }

    export type MiddlewareDefinition = {
      name: string
      description: string
      order: number
      handler: Function
      direction: EventDirection
      enabled: boolean
    }

    export interface EventConstructor {
      (args: EventCtorArgs): Event
    }

    export const Event: EventConstructor
  }

  export type UserAttribute = { key: string; value: string; type: string }

  export type UserAttributeMap = UserAttribute[] & {
    get(key: string): string | undefined
  }

  export type User = {
    id: string
    channel: string
    createdOn: Date
    updatedOn: Date
    attributes: UserAttributeMap
    otherChannels?: User[]
  }

  export type EventDirection = 'incoming' | 'outgoing'

  /**
   * ////////////////
   * //////// API
   * ////////////////
   */

  export namespace realtime {
    export function sendPayload(payload: RealTimePayload)
  }

  export type RouterCondition = boolean | ((req: any) => boolean)

  export type RouterOptions = {
    checkAuthentication: RouterCondition
    enableJsonBodyParser: RouterCondition
  }

  export namespace http {
    export function createShortLink(): void
    export function createRouterForBot(routerName: string, options?: RouterOptions): any // TODO Better interface for the router
  }

  export namespace events {
    export function registerMiddleware(middleware: IO.MiddlewareDefinition): void
    export function sendEvent(event: IO.Event): void
  }

  export type GetOrCreateResult<T> = Promise<{
    created: boolean
    result: T
  }>

  export namespace users {
    export function getOrCreateUser(channelName: string, userId: string): GetOrCreateResult<User>
    export function updateAttributes(channel: string, id: string, attributes: UserAttribute[]): Promise<void>
  }

  export namespace dialog {
    export function processMessage(userId: string, event: IO.Event): Promise<void>
    export function deleteSession(userId: string): Promise<void>
    export function getState(userId: string): Promise<void>
    export function setState(userId: string, state: any): Promise<void>
  }

  export namespace config {
    export function getModuleConfig(moduleId: string): Promise<any>
    export function getModuleConfigForBot(moduleId: string, botId: string): Promise<any>
  }

  export const logger: Logger
}
