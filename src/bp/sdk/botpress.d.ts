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
      /**
       * Whether the event should be processed by the dialog engine.
       */
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
     * A BotpressEvent is how conversational channels interact with Botpress. Events represent all the interactions
     * that make up a conversation. That means the different message types (text, image, buttons, carousels etc) but also
     * the navigational events (chat open, user typing) and contextual events (user returned home, order delivered).
     */
    export interface Event {
      readonly id: Number
      /**
       * The type of the event, i.e. image, text, timeout, etc
       */
      readonly type: string
      /**
       * The channel of communication, i.e web, messenger, twillio
       */
      readonly channel: string
      /**
       * Who will receive this message, usually a user's id
       */
      readonly target: string
      /**
       * Is it (in)coming from the user to the bot or (out)going from the bot to the user?
       */
      readonly direction: EventDirection
      /**
       * The channel-specific raw payload
       */
      readonly payload: any
      /**
       * The id of the bot on which this event is relating to
       */
      readonly botId: string
      /**
       * The id of the thread this message is relating to (only on supported channels)
       */
      readonly threadId?: string
      /**
       * A textual representation of the event
       */
      readonly preview: string
      /**
       * Verify if the event has a specific flag
       * @param flag The flag symbol to verify. {@link IO.WellKnownFlags} to know more about existing flags
       * @returns Return wheter or not the event has the flag
       * @example event.hasFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE)
       */
      hasFlag(flag: symbol): boolean
      /**
       * Sets a flag on the event so it can be intercepted and properly handled if the case applies
       * @param flag The flag symbol to set. {@link IO.WellKnownFlags}
       * @param value The value of the flag.
       * @example event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
       */
      setFlag(flag: symbol, value: boolean): void
    }

    /**
     * The definition of the middleware that will be executed in the middleware chain.
     * There are two middleware chains - an incoming and an outgoing.
     * The incoming middleware chain is executed when botpress is receiving an event.
     * The outgoing middleware chain is executed when botpress is sending an event.
     */
    export type MiddlewareDefinition = {
      /**
       * The name identifying the middleware
       */
      name: string
      description: string
      /**
       * The order of executing of the middleware in the chain
       */
      order: number
      /**
       * The middleware function to execute
       */
      handler: Function
      /**
       * The direction of the event. This will dictate which middleware chain to register to
       */
      direction: EventDirection
      /**
       * Whether the middleware is enabled or disabled
       */
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

  /**
   * The direction of the event. An incoming event will register itself into the incoming middleware chain.
   * An outgoing event will register itself into the outgoing middleware chain.
   * @see MiddlewareDefinition to learn more about middleware.
   */
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

  /**
   * The configuration definition of a bot.
   */
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

  export enum LogLevel {
    PRODUCTION = 0,
    DEV = 1,
    DEBUG = 2
  }

  /**
   * A Content Element is a single item of a particular Content Type @see ContentType.
   * Content Types contain many Elements. An Element belongs to a single Content Type.
   */
  export interface ContentElement {
    id: string
    /**
     * The Id of the Content Type for which the Element belongs to.
     */
    contentType: string
    /**
     * The raw form data that contains templating that needs to be interpreted.
     */
    formData: object
    /**
     * The computed form data that contains the interpreted data.
     */
    computedData: object
    /**
     * The textual representation of the Content Element.
     */
    previewText: string
    createdOn: Date
    modifiedOn: Date
    createdBy: string
  }

  /**
   * A Content Type describes a grouping of Content Elements @see ContentElement sharing the same properties.
   * They can describe anything and everything – they most often are domain-specific to your bot.
   */
  export type ContentType = {
    id: string
    title: string
    description: string
    /**
     * The jsonSchema used to validate the form data of the Content Elements.
     */
    jsonSchema: object
    uiSchema?: object

    /**
     * Function that defines how a Content Type gets rendered on the different channels.
     * This function resides in the javascript definition of the Content Type.
     *
     * @param data The necessary data to render the Content Elements. e.g. Text, images, button actions, etc.
     * @param channel The channel of communication. e.g. channel-web, messenger, twilio, etc.
     * @returns Return an array of rendered Content Elements
     */
    renderElements: (data: object, channel: string) => object[]
    /**
     * Function that computes the visual representation of the text.
     * This function resides in the javascript definition of the Content Type.
     */
    computePreviewText?: (formData: object) => string
    /**
     * Function that computes the form data of the content type.
     * This function resides in the javascript definition of the Content Type.
     */
    computeData?: (typeId: string, formData: object) => object
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

  export interface FlowGenerationResult {
    flow: SkillFlow
    transitions: NodeTransition[]
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

  ////////////////
  //////// API
  ////////////////

  /**
   * Realtime is used to communicate with the client via websockets
   */
  export namespace realtime {
    /**
     * Sends a payload to the client via the websocket
     * @param payload The payload to send
     */
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

  /**
   * Events is used to interact with the middleware chains. i.e. send an event, register a middleware.
   */
  export namespace events {
    /**
     * Registers a middleware in the middleware chain.
     * @param middleware
     */
    export function registerMiddleware(middleware: IO.MiddlewareDefinition): void
    export function sendEvent(event: IO.Event): void
    export function replyToEvent(event: IO.Event, payloads: any[])
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

  /**
   * A state is mutable object that contains properties used by the dialog engine during a conversation.
   * Properties like "nickname" or "nbOfConversations" used during a conversation to execute flow logic. e.g. Navigating to a certain node when a condition is met.
   */
  export type State = any

  /**
   * The dialog engine is what processes conversations. It orchestrates the conversationnal flow logic.
   */
  export namespace dialog {
    /**
     * Calls the dialog engine to start processing an event.
     * @param sessionId A unique string that will be used to identify the session. We recommend using the user Id. e.g. a messenger user Id, a slack user Id or a web application user Id
     * @param event The event to be processed by the dialog engine
     */
    export function processEvent(sessionId: string, event: IO.Event): Promise<void>
    /**
     * Deletes a session
     * @param sessionId The Id of the session to delete
     */
    export function deleteSession(sessionId: string): Promise<void>
    /**
     * Gets the state object of a session
     * @param sessionId The session Id from which to get the state
     */
    export function getState(sessionId: string): Promise<void>
    /**
     * Sets a new state for the session. **The state will be overwritten**.
     * @param sessionId The Id of the session
     * @param state The state object to set in the session.
     * @example
     * bp.dialog.setState(sessionId, {...state, newProp: 'a new property'})
     */
    export function setState(sessionId: string, state: State): Promise<void>
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
    export function renderElement(contentTypeId: string, payload: any, channel: string)
  }

  export const logger: Logger
}
