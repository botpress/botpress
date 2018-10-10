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
    attachError(error: Error): this

    /**
     * Sets the level that will be required at runtime to
     * display the next message.
     * 0 = Info / Error (default)
     * 1 = Warning
     * 2 = Debug
     * 3 = Silly
     * @param level The level to apply for the next message
     */
    level(level: LogLevel): this
    debug(message: string, metadata?: any): void
    info(message: string, metadata?: any): void
    warn(message: string, metadata?: any): void
    error(message: string, metadata?: any): void
  }

  export type ModuleConfig = { [key: string]: ModuleConfigEntry }

  export interface ModuleEntryPoint {
    onInit: Function
    onReady: Function
    config: ModuleConfig
    defaultConfigJson?: string
    serveFile?: ((path: string) => Promise<Buffer>)
    definition: ModuleDefinition
    flowGenerator?: any
  }

  export interface ModuleDefinition {
    name: string
    fullName?: string
    plugins?: ModulePluginEntry[]
    moduleView?: ModuleViewOptions
    noInterface?: boolean
    menuIcon?: string
    menuText?: string
    homepage?: string
  }

  export interface ModulePluginEntry {
    entry: 'WebBotpressUIInjection'
    position: 'overlay'
  }

  export interface ModuleViewOptions {
    stretched: boolean
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
    public static forAdmins(eventName: string, payload: any): RealTimePayload
  }

  export namespace IO {
    export type EventDirection = 'incoming' | 'outgoing'
    export namespace WellKnownFlags {
      export const SKIP_DIALOG_ENGINE: symbol
      export const SKIP_QNA_PROCESSING: symbol
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

  export type Notification = {
    botId: string
    message: string
    level: string
    moduleId?: string
    moduleIcon?: string
    moduleName?: string
    redirectUrl?: string
  }

  export interface ScopedGhostService {
    upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<void>
    readFileAsBuffer(rootFolder: string, file: string): Promise<Buffer>
    readFileAsString(rootFolder: string, file: string): Promise<string>
    readFileAsObject<T>(rootFolder: string, file: string): Promise<T>
    deleteFile(rootFolder: string, file: string): Promise<void>
    directoryListing(rootFolder: string, fileEndingPattern: string): Promise<string[]>
  }

  export type BotConfig = {
    $schema?: string
    id: string
    name: string
    active: boolean
    description?: string
    author?: string
    version: string
    license?: string
    imports: {
      modules: string[]
      contentTypes: string[]
      incomingMiddleware: string[]
      outgoingMiddleware: string[]
    }
    dialog?: DialogConfig
    logs?: LogsConfig
  }

  export interface LogsConfig {
    expiration: string
  }

  export interface DialogConfig {
    timeoutInterval: string
  }

  export interface ContentElement {
    id: string
    contentType: string
    formData: object
    computedData: object
    createdOn: Date
    createdBy: string
    modifiedOn: Date
    previewText: string
  }

  export enum LogLevel {
    PRODUCTION = 0,
    DEV = 1,
    DEBUG = 2
  }

  export type ContentType = {
    id: string
    title: string
    description: string
    jsonSchema: object
    uiSchema?: object
    computePreviewText?: (formData: object) => string
    computeData?: (typeId: string, formData: object) => object
    renderElement: (data: object, channel: string) => object[]
  }

  export interface Flow {
    name: string
    location?: string
    version?: string
    startNode?: string
    skillData?: any
    nodes: FlowNode[]
    catchAll?: NodeActions
    timeoutNode?: string
    type?: string
    timeout?: { name: string; flow: string; node: string }[]
  }

  export type SkillFlow = Partial<Flow> & Pick<Required<Flow>, 'nodes'>

  export type FlowNode = {
    id?: string
    name: string
    type?: any
    timeoutNode?: string
    flow?: string
  } & (NodeActions)

  export type SkillFlowNode = Partial<FlowNode> & Pick<Required<FlowNode>, 'name'>

  export interface NodeTransition {
    caption?: string
    condition: string
    node: string
  }

  export interface NodeActions {
    onEnter?: ActionBuilderProps[] | string[]
    onReceive?: ActionBuilderProps[] | string[]
    next?: NodeTransition[]
  }

  export interface ActionBuilderProps {
    name: string
    type: NodeActionType
    args?: any
  }

  export enum NodeActionType {
    RenderElement = 'render',
    RunAction = 'run',
    RenderText = 'say'
  }

  export interface AxiosBotConfig {
    baseURL: string
    headers: object
  }

  export interface Paging {
    start: number
    count: number
  }

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
    export function getAxiosConfigForBot(botId: string): Promise<AxiosBotConfig>
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
    export function getAllUsers(paging?: Paging): Promise<any>
    export function getUserCount(): Promise<any>
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

  export namespace kvs {
    export function get(botId: string, key: string, path?: string): Promise<any>
    export function set(botId: string, key: string, value: any, path?: string): Promise<void>
    export function setStorageWithExpiry(botId: string, key: string, value, expiryInMs?: string)
    export function getStorageWithExpiry(botId: string, key: string)
    export function getConversationStorageKey(sessionId: string, variable: string): string
    export function getUserStorageKey(userId: string, variable: string): string
    export function getGlobalStorageKey(variable: string): string
    export function removeStorageKeysStartingWith(key): Promise<void>
  }

  export namespace bots {
    export function getAllBots(): Promise<Map<string, BotConfig>>
  }

  export namespace notifications {
    export function create(botId: string, notification: Notification): Promise<any>
  }

  export namespace ghost {
    export function forBot(botId: string): ScopedGhostService
  }

  export namespace cms {
    export function getContentElement(botId: string, id: string): Promise<ContentElement>
    export function listContentElements(botId: string, contentTypeId?: string): Promise<ContentElement[]>
    export function getAllContentTypes(botId?: string): Promise<ContentType[]>
  }

  export const logger: Logger
}
