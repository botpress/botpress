import { RealTimeAPI } from './common/realtime'

declare module 'botpress' {
  /**
   * The version of Botpress the Botpress Server running
   */
  export const version: string

  export type MiddlewareEventDirection = 'incoming' | 'outgoing'

  export type ExtendedKnex = Knex & KnexExtension

  export type ColumnOrDate = string | Date | Knex.Sql

  export type KnexExtension_Date = {
    format(exp: any): Knex.Raw
    now(): Knex.Raw
    isBefore(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
    isAfter(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
    isBetween(date: ColumnOrDate, betweenA: ColumnOrDate, betweenB: ColumnOrDate): Knex.Raw
    isSameDay(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
    hourOfDay(date: ColumnOrDate): Knex.Raw
  }

  export type KnexExtension_Bool = {
    true(): any
    false(): any
    parse(value: any): boolean
  }

  export type KnexExtension_Json = {
    set(obj: any): any
    get(obj: any): any
  }

  export type KnexCallback = (tableBuilder: Knex.CreateTableBuilder) => any

  export type KnexExtension = {
    isLite: boolean
    createTableIfNotExists(tableName: string, cb: KnexCallback): Promise<boolean>
    date: KnexExtension_Date
    bool: KnexExtension_Bool
    json: KnexExtension_Json
    insertAndRetrieve<T>(
      tableName: string,
      data: {},
      returnColumns?: string | string[],
      idColumnName?: string
    ): Promise<T>
  }

  export type QueryBuilder = Knex.QueryBuilder

  export type GetOrCreateResult<T> = Promise<{
    created: boolean
    result: T
  }>

  export type BotpressEventCtorArgs = {
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
   * TODO Document this
   */
  export namespace WellKnownEventFlags {
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
  export class BotpressEvent {
    public readonly id: Number
    public readonly type: string
    public readonly channel: string
    public readonly target: string
    public readonly direction: EventDirection
    public readonly payload: any
    public readonly botId: string
    public readonly threadId?: string
    public readonly preview: string
    private readonly flags: any

    constructor(args: BotpressEventCtorArgs) {
      this.type = args.type
      this.channel = args.channel
      this.direction = args.direction
      this.payload = args.payload
      this.target = args.target
      this.botId = args.botId

      this.threadId = args.threadId ? args.threadId.toString() : undefined
      this.id = args.id || Date.now() * 100000 + ((Math.random() * 100000) | 0)
      this.preview = args.preview || this.constructPreview()
      this.flags = {}
    }

    public hasFlag(flag: string): boolean {
      return Boolean(this.flags[flag.toLowerCase()])
    }

    public setFlag(flag: string, value: boolean) {
      this.flags[flag.toLowerCase()] = value
    }

    private constructPreview(): string {
      if (!this.payload) {
        return `"${this.type}" event on channel ${this.channel}`
      }

      return this.payload.__preview || this.payload.preview || this.payload.text
    }
  }

  export class Level {
    constructor(public name: string, public color: string) {}
  }

  export namespace Level {
    export const Info = new Level('info', 'green')
    export const Debug = new Level('debug', 'blue')
    export const Warn = new Level('warn', 'yellow')
    export const Error = new Level('error', 'red')
  }

  type LogEntryArgs = {
    botId?: string
    level: string
    scope: string
    message: string
    metadata: any
    timestamp: string
  }
  export class LogEntry {
    botId?: string
    level: string
    scope: string
    message: string
    metadata: any
    timestamp: string

    constructor(args: LogEntryArgs) {
      this.botId = args.botId
      this.level = args.level
      this.scope = args.scope
      this.message = args.message
      this.metadata = args.metadata
      this.timestamp = args.timestamp
    }
  }

  export type MiddlewareDefinition = {
    name: string
    description: string
    order: number
    handler: Function
    direction: EventDirection
    enabled?: boolean
    /**
     * @deprecated since version 12.0
     */
    type?: string
    /**
     * @deprecated since version 12.0
     */
    module?: string
  }

  export type ModuleMetadata = {
    name: string
    version: string
    incomingMiddleware: Array<MiddlewareDefinition>
    outgoingMiddleware: Array<MiddlewareDefinition>
  }

  export type ModuleFile = {}

  export type ModuleDefinition = {
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

  export interface ChannelOutgoingHandler {
    processContentElement(element): Promise<BotpressEvent[]>
    readonly channel: string
  }

  export class RealTimePayload {
    readonly eventName: string
    readonly payload: any

    constructor(eventName: string, payload: any) {
      this.eventName = eventName.toLowerCase()
      this.payload = payload
    }

    /**
     * Creates a payload to be send to a unique visitor.
     * A visitor is essentially a unique socket user surfing a Botpress-enabled interface.
     * Interfaces include the Botpress Dashboard and the Botpress Webchat.
     * @param visitorId The ID of the visitor, on the Webchat this is the channel-web `userId`
     */
    static forVisitor(visitorId: string, eventName: string, payload: any): RealTimePayload {
      if (!eventName.toLowerCase().startsWith('guest.')) {
        eventName = 'guest.' + eventName
      }

      return new RealTimePayload(eventName, {
        ...payload,
        __room: `visitor:${visitorId}`
      })
    }
  }

  export type ChannelUserAttribute = { key: string; value: string; type: string }

  export type ChannelUserAttributes = ChannelUserAttribute[] & {
    get(key: string): string | undefined
  }

  export type ChannelUser = {
    id: string
    channel: string
    createdOn: Date
    updatedOn: Date
    attributes: ChannelUserAttributes
    otherChannels?: ChannelUser[]
  }

  export interface RealTimeAPI {
    sendPayload(payload: RealTimePayload)
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

  export interface Logger {
    forBot(botId: string): this
    debug(message: string, metadata?: any): void
    info(message: string, metadata?: any): void
    warn(message: string, metadata?: any): void
    error(message: string, metadata?: any): void
    error(message: string, error: Error, metadata?: any): void
  }

  export interface EventAPI {
    registerMiddleware(middleware: MiddlewareDefinition): void
    sendEvent(event: BotpressEvent): void
  }

  export interface UserAPI {
    getOrCreateUser(channelName: string, userId: string): GetOrCreateResult<ChannelUser>
    updateAttributes(channel: string, id: string, attributes: ChannelUserAttribute[]): Promise<void>
  }

  export interface DialogAPI {
    processMessage(userId: string, event: BotpressEvent): Promise<void>
    deleteSession(userId: string): Promise<void>
    getState(userId: string): Promise<void>
    setState(userId: string, state: any): Promise<void>
  }

  export interface ConfigAPI {
    getModuleConfig(moduleId: string): Promise<any>
    getModuleConfigForBot(moduleId: string, botId: string): Promise<any>
  }

  export interface CoreSDK {
    http: HttpAPI
    events: EventAPI
    logger: LoggerAPI
    dialog: DialogAPI
    config: ConfigAPI
    database: ExtendedKnex
    users: UserAPI
    realtime: RealTimeAPI
  }
}
