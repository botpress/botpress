import Knex from 'knex'
import { Router, Request } from 'express'

declare namespace Middleware {
  export type EventDirection = 'incoming' | 'outgoing'
}

interface KnexExtension {
  isLite: boolean
  createTableIfNotExists(tableName: string, cb: Knex.KnexCallback): Promise<boolean>
  date: Knex.Date
  bool: Knex.Bool
  json: Knex.Json
  insertAndRetrieve<T>(
    tableName: string,
    data: {},
    returnColumns?: string | string[],
    idColumnName?: string
  ): Promise<T>
}

declare namespace Logging {
  type LogEntryArgs = {
    botId?: string
    level: string
    scope: string
    message: string
    metadata: any
    timestamp: string
  }

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
}

declare namespace IO {
  export type BotpressEventCtorArgs = {
    id?: Number
    type: string
    channel: string
    target: string
    direction: Middleware.EventDirection
    preview?: string
    payload: any
    threadId?: string
    botId: string
  }

  export namespace WellKnownFlags {
    export const SKIP_DIALOG_ENGINE = 'skipDialogEngine'
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
    readonly direction: Middleware.EventDirection
    readonly payload: any
    readonly botId: string
    readonly threadId?: string
    readonly preview: string
    hasFlag(flag: string): boolean
    setFlag(flag: string, value: boolean)
  }

  interface EventConstructor {
    new (args: BotpressEventCtorArgs): Event
  }

  export type MiddlewareDefinition = {
    name: string
    description: string
    order: number
    handler: Function
    direction: Middleware.EventDirection
    enabled: boolean
  }

  export const Event: EventConstructor
}

declare namespace RealTime {
  export interface Payload {
    readonly eventName: string
    readonly payload: any
  }

  interface RealTimePayloadFactory {
    forVisitor(visitorId: string, eventName: string, payload: any): Payload
  }

  export const Payload: RealTimePayloadFactory
}

// export class BotpressEventFactory {
//   public readonly id: Number
//   public readonly type: string
//   public readonly channel: string
//   public readonly target: string
//   public readonly direction: MiddlewareEventDirection
//   public readonly payload: any
//   public readonly botId: string
//   public readonly threadId?: string
//   public readonly preview: string
//   private readonly flags: any

//   constructor(args: BotpressEventCtorArgs) {
//     this.type = args.type
//     this.channel = args.channel
//     this.direction = args.direction
//     this.payload = args.payload
//     this.target = args.target
//     this.botId = args.botId

//     this.threadId = args.threadId ? args.threadId.toString() : undefined
//     this.id = args.id || Date.now() * 100000 + ((Math.random() * 100000) | 0)
//     this.preview = args.preview || this.constructPreview()
//     this.flags = {}
//   }

//   public hasFlag(flag: string): boolean {
//     return Boolean(this.flags[flag.toLowerCase()])
//   }

//   public setFlag(flag: string, value: boolean) {
//     this.flags[flag.toLowerCase()] = value
//   }

//   private constructPreview(): string {
//     if (!this.payload) {
//       return `"${this.type}" event on channel ${this.channel}`
//     }

//     return this.payload.__preview || this.payload.preview || this.payload.text
//   }
// }

// export class RealTimePayload {
//   readonly eventName: string
//   readonly payload: any

//   constructor(eventName: string, payload: any) {
//     this.eventName = eventName.toLowerCase()
//     this.payload = payload
//   }

//   /**
//    * Creates a payload to be send to a unique visitor.
//    * A visitor is essentially a unique socket user surfing a Botpress-enabled interface.
//    * Interfaces include the Botpress Dashboard and the Botpress Webchat.
//    * @param visitorId The ID of the visitor, on the Webchat this is the channel-web `userId`
//    */
//   static forVisitor(visitorId: string, eventName: string, payload: any): RealTimePayload {
//     if (!eventName.toLowerCase().startsWith('guest.')) {
//       eventName = 'guest.' + eventName
//     }

//     return new RealTimePayload(eventName, {
//       ...payload,
//       __room: `visitor:${visitorId}`
//     })
//   }
// }

declare namespace Users {
  export type Attribute = { key: string; value: string; type: string }

  export type AttributeMap = Attribute[] & {
    get(key: string): string | undefined
  }

  export type User = {
    id: string
    channel: string
    createdOn: Date
    updatedOn: Date
    attributes: AttributeMap
    otherChannels?: User[]
  }
}
