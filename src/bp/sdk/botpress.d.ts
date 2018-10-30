/**
 * This is the official Botpress SDK, designed to help our fellow developers to create wonderful modules and
 * extend the world's best chatbot functionnality to make it even better! Your module will receives an instance of
 * this SDK (Yes, all those beautiful features!) to kick start your development. Missing something important?
 * Please let us know in our official Github Repo!
 */
declare module 'botpress/sdk' {
  /**
   * Returns the current version of Botpress
   */
  export const version: string

  /**
   * This variable gives you access to the Botpress database via Knex.
   * When developing modules, you can use this to create tables and manage data
   * @example bp.database('srv_channel_users').insert()
   */
  export const database: any

  /**
   * The logger instance is automatically scoped to the calling module
   * @example bp.logger.info('Hello!') will output: Mod[myModule]: Hello!
   */
  export const logger: Logger

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

  export enum LogLevel {
    PRODUCTION = 0,
    DEV = 1,
    DEBUG = 2
  }

  export interface Logger {
    forBot(botId: string): this
    attachError(error: Error): this
    persist(shouldPersist: boolean): this
    level(level: LogLevel): this

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

  /**
   * The Module Entry Point is used by the module loader to bootstrap the module. It must be present in the index.js file
   * of the module. The path to the module must also be specified in the global botpress config.
   */
  export interface ModuleEntryPoint {
    /** Called once the core is initialized. Usually for middlewares / database init */
    onServerStarted: ((bp: typeof import('botpress/sdk')) => void)
    /** This is called once all modules are initialized, usually for routing and logic */
    onServerReady: ((bp: typeof import('botpress/sdk')) => void)
    onBotMount?: ((bp: typeof import('botpress/sdk'), botId: string) => void)
    onBotUnmount?: ((bp: typeof import('botpress/sdk'), botId: string) => void)
    /** The configuration options of the module */
    config: ModuleConfig
    /** This is used to create the json config file if none is present */
    defaultConfigJson?: string
    /** Used to expose the JS files for the frontend */
    serveFile?: ((path: string) => Promise<Buffer>)
    /** Additional metadata about the module */
    definition: ModuleDefinition
    /** An array of the flow generators used by skills in the module */
    flowGenerator?: any
  }

  export interface ModuleDefinition {
    /** This name should be in lowercase and without special characters (only - and _) */
    name: string
    fullName?: string
    plugins?: ModulePluginEntry[]
    /** Additional options that can be applied to the module's view */
    moduleView?: ModuleViewOptions
    /** If set to true, no menu item will be displayed */
    noInterface?: boolean
    /** An icon to display next to the name, if none is specified, it will receive a default one */
    menuIcon?: string
    /** The name displayed on the menu */
    menuText?: string
    /** Optionnaly specify a link to your page or github repo */
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
      /** When this flag is active, the dialog engine will ignore those events */
      export const SKIP_DIALOG_ENGINE: symbol
      /** When this flag is active, the QNA module won't intercept this event */
      export const SKIP_QNA_PROCESSING: symbol
    }

    /**
     * These are the arguments required when creating a new {@link Event}
     */
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
      /** The type of the event, i.e. image, text, timeout, etc */
      readonly type: string
      /** The channel of communication, i.e web, messenger, twillio */
      readonly channel: string
      /** Who will receive this message, usually a user id */
      readonly target: string
      /** Is it (in)coming from the user to the bot or (out)going from the bot to the user? */
      readonly direction: EventDirection
      /** The channel-specific raw payload */
      readonly payload: any
      /** The id of the bot on which this event is relating to  */
      readonly botId: string
      /** The id of the thread this message is relating to (only on supported channels) */
      readonly threadId?: string
      /** A textual representation of the event */
      readonly preview: string
      /**
       * Check if the event has a specific flag
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
     * The Middleware Definition is used by the event engine to register a middleware in the chain. The order in which they
     * are executed is important, since some may require previous processing, while others can swallow the events.
     * Incoming chain is executed when the bot receives an event.
     * Outgoing chain is executed when an event is sent to a user
     */
    export type MiddlewareDefinition = {
      /** The internal name used to identify the middleware in configuration files */
      name: string
      description: string
      /** The position in which this middleware should intercept messages in the middleware chain. */
      order: number
      /** A method with two parameters (event and a callback) used to handle the event */
      handler: Function
      /** Indicates if this middleware should act on incoming or outgoing events */
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

  /**
   * The direction of the event. An incoming event will register itself into the incoming middleware chain.
   * An outgoing event will register itself into the outgoing middleware chain.
   * @see MiddlewareDefinition to learn more about middleware.
   */
  export type EventDirection = 'incoming' | 'outgoing'

  export type Notification = {
    botId: string
    message: string
    /** Can be info, error, success */
    level: string
    moduleId?: string
    moduleIcon?: string
    moduleName?: string
    /** An URL to redirect to when the notification is clicked */
    redirectUrl?: string
  }

  export interface ScopedGhostService {
    /**
     * Insert or Update the file at the specified location
     * @param rootFolder - Folder relative to the scoped parent
     * @param file - The name of the file
     */
    upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<void>
    readFileAsBuffer(rootFolder: string, file: string): Promise<Buffer>
    readFileAsString(rootFolder: string, file: string): Promise<string>
    readFileAsObject<T>(rootFolder: string, file: string): Promise<T>
    deleteFile(rootFolder: string, file: string): Promise<void>
    /**
     * List all the files matching the ending pattern in the folder
     * @example bp.ghost.forBot('welcome-bot').directoryListing('./questions', '*.json')
     * @param rootFolder - Folder relative to the scoped parent
     * @param fileEndingPattern - The pattern to match. Don't forget to include wildcards!
     */
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
      /** Not currently used */
      modules: string[]
      /** Defines the list of content types supported by the bot */
      contentTypes: string[]
      /** Not currently used */
      incomingMiddleware: string[]
      /** Not currently used */
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

  /**
   * A Content Element is a single item of a particular Content Type @see ContentType.
   * Content Types contains many Elements. An Element belongs to a single Content Type.
   */
  export interface ContentElement {
    id: string
    /** The Id of the Content Type for which the Element belongs to. */
    contentType: string
    /** The raw form data that contains templating that needs to be interpreted. */
    formData: object
    /** The computed form data that contains the interpreted data.*/
    computedData: object
    /** The textual representation of the Content Element.  */
    previewText: string
    createdOn: Date
    modifiedOn: Date
    createdBy: string
  }

  /**
   * A Content Type describes a grouping of Content Elements @see ContentElement sharing the same properties.
   * They can describe anything and everything – they most often are domain-specific to your bot. They also
   * tells botpress how to display the content on various channels
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
     * Function that defines how a Content Type gets rendered on different channels.
     * This function resides in the javascript definition of the Content Type.
     *
     * @param data The data required to render the Content Elements. e.g. Text, images, button actions, etc.
     * @param channel The channel used to communicate, e.g. channel-web, messenger, twilio, etc.
     * @returns Return an array of rendered Content Elements
     */
    renderElement: (data: object, channel: string) => object[]
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

  /**
   * The flow is used by the dialog engine to answer the user and send him to the correct destination
   * */
  export interface Flow {
    name: string
    location?: string
    version?: string
    /** This is the home node. The user will be directed there when he enters the flow */
    startNode: string
    /** An object containing all the properties required to edit a skill */
    skillData?: any
    /** An array of all the nodes included in the flow */
    nodes: FlowNode[]
    /** Those actions are attached to the flow and can be triggered regardless of the user's current node */
    catchAll?: NodeActions
    /** The name of the node to send the user if he reaches the timeout threshold */
    timeoutNode?: string
    type?: string
    timeout?: { name: string; flow: string; node: string }[]
  }

  /**
   * This interface is used to encapsulate the logic around the creation of a new skill. A skill
   * is a subflow which can have multiple nodes and custom logic, while being hidden under a single node in the main flow.
   * The node transitions specified here are applied on the node in the main flow. Once the user enters the node,
   * the flow takes over
   */
  export interface FlowGenerationResult {
    /**
     * A partial flow originating from a skill flow generator. Missing pieces will be automatically added
     * once the flow is sent to Botpress, the final product will be a Flow.
     * */
    flow: SkillFlow
    /** An array of possible transitions for the parent node */
    transitions: NodeTransition[]
  }

  /**
   * The partial flow is only used to make some nodes optional. Those left empty will be automatically
   * generated by the skill service.
   */
  export type SkillFlow = Partial<Flow> & Pick<Required<Flow>, 'nodes'>

  export type FlowNode = {
    id?: string
    name: string
    type?: any
    timeoutNode?: string
    flow?: string
  } & (NodeActions)

  export type SkillFlowNode = Partial<FlowNode> & Pick<Required<FlowNode>, 'name'>

  /**
   * Node Transitions are all the possible outcomes when a user's interaction on a node is completed. The possible destinations
   * can be any node: a node in the same flow, one in a subflow, return to the parent flow, end discussion... etc.
   * There are special nodes:
   * - # - Send the user to the previous flow, at the calling node
   * - #node - Send the user to the previous flow, at a specific node
   * - ## - Send the user to the starting node of the previous flow
   * - END - End the current dialog
   * - node - Send the user to a specific node in the current flow
   */
  export interface NodeTransition {
    /** The text to display instead of the condition in the flow editor */
    caption?: string
    /** A JS expression thas is evaluated to determine if it should send the user to the specified node */
    condition: string
    /** The destination node */
    node: string
  }

  /**
   * A Node Action represent all the possible actions that will be executed when the user is on the node. When the user
   * enters the node, actions in the 'onEnter' are executed. If there are actions in 'onReceive', they will be called
   * once the user reply something. Transitions in 'next' are evaluated after all others to determine where to send
   */
  export interface NodeActions {
    /** An array of actions to take when the user enters the node */
    onEnter?: ActionBuilderProps[] | string[]
    /** An array of actions to take when the user replies */
    onReceive?: ActionBuilderProps[] | string[]
    /** An array of possible transitions once everything is completed */
    next?: NodeTransition[]
  }

  export interface ActionBuilderProps {
    name: string
    type: NodeActionType
    args?: any
  }

  /**
   * The Node Action Type is used by the skill service to tell the dialog engine what action to take.
   */
  export enum NodeActionType {
    RenderElement = 'render',
    RunAction = 'run',
    RenderText = 'say'
  }

  /**
   * The AxiosBotConfig contains the axios configuration required to call the api of another module.
   * @example: axios.get('/api/ext/module', axiosBotConfig)
   */
  export interface AxiosBotConfig {
    /** The base url of the bot.
     * @example http://localhost:3000/
     * */
    baseURL: string
    /** This object includes the required headers to send the request to the selected bot */
    headers: object
  }

  /**
   * Simple interface to use when paging is required
   */
  export interface Paging {
    /** The index of the first element */
    start: number
    /** How many elements should be returned */
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

  /**
   * Those are possible options you may enable when creating new routers
   */
  export type RouterOptions = {
    /**
     * Check if user is authenticated before granting access
     * @default true
     */
    checkAuthentication: RouterCondition

    /**
     * Parse the body as JSON when possible
     * @default true
     */
    enableJsonBodyParser: RouterCondition
  }

  export namespace http {
    /**
     * Create a shortlink to any destination
     *
     * @example bp.http.createShortLink('chat', '/lite', {m: 'channel-web', v: 'fullscreen' })
     * @example http://localhost:3000/s/chat
     * @param name - The name of the link, must be unique
     * @param destination - The URL to redirect to. It can be relative or absolute
     * @param params - An optional query string to add at the end of the url. You may specify an object
     */
    export function createShortLink(name: string, destination: string, params?: any): void

    /**
     * Create a new router for a module. Once created, use them to register new endpoints. Routers created
     * with this method are accessible via the url /api/ext/{routernName}
     *
     * @example const router = bp.http.createRouterForBot('myModule')
     * @example router.get('/list', ...)
     * @example axios.get('/api/ext/myModule/list')
     * @param routerName - The name of the router
     * @param options - Additional options to apply to the router
     * @param router - The router
     */
    export function createRouterForBot(routerName: string, options?: RouterOptions): any // TODO Better interface for the router

    /**
     * Returns the required configuration to make an API call to another module by specifying only the relative path.
     * @param botId - The ID of the bot for which to get the configuration
     * @returns The configuration to use
     */
    export function getAxiosConfigForBot(botId: string): Promise<AxiosBotConfig>
  }

  /**
   * Events is the base communication channel of the bot. Messages and payloads are a part of it,
   * and it is the only way to receive or send informations. Each event goes through the whole middleware chain (incoming or outgoing)
   * before being received by either the bot or the user.
   */
  export namespace events {
    /**
     * Register a new middleware globally. They are sorted based on their declared order each time a new one is registered.
     * @param midddleware - The middleware definition to register
     */
    export function registerMiddleware(middleware: IO.MiddlewareDefinition): void

    /**
     * Send an event through the incoming or outgoing middleware chain
     * @param event - The event to send
     */
    export function sendEvent(event: IO.Event): void

    /**
     * Reply easily to any received event. It accepts an array of payloads
     * and will send a complete event with each payloads. It is often paired with
     * {@link cms.renderElement} to generate payload for a specific content type
     *
     * @param event - An original event to reply to
     * @param payloads - One or multiple payloads to send
     */
    export function replyToEvent(event: IO.Event, payloads: any[]): void
  }

  export type GetOrCreateResult<T> = Promise<{
    created: boolean
    result: T
  }>

  export namespace users {
    /**
     * Returns an existing user or create a new one with the specified keys
     */
    export function getOrCreateUser(channel: string, userId: string): GetOrCreateResult<User>

    /**
     * Update attributes of a specific user
     */
    export function updateAttributes(channel: string, userId: string, attributes: UserAttribute[]): Promise<void>
    export function getAllUsers(paging?: Paging): Promise<any>
    export function getUserCount(): Promise<any>
  }

  /**
   * A state is a mutable object that contains properties used by the dialog engine during a conversation.
   * Properties like "nickname" or "nbOfConversations" are used during a conversation to execute flow logic. e.g. Navigating to a certain node when a condition is met.
   */
  export type State = any

  /**
   * The dialog engine is what processes conversations. It orchestrates the conversationnal flow logic.
   */
  export namespace dialog {
    /**
     * Create a session Id from a Botpress Event
     * @param event The event used to create the Dialog Session Id
     */
    export function createId(event: IO.Event): Promise<string>
    /**
     * Calls the dialog engine to start processing an event.
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

    /**
     * Jumps to a specific flow and optionaly a specific node. This is useful when the default flow behaviour needs to be bypassed.
     * @param sessionId The Id of the the current Dialog Session. If the session doesn't exists, it will be created with this Id.
     * @param event The event to be processed
     * @param flowName The name of the flow to jump to
     * @param nodeName The name of the optionnal node to jump to.
     * The node will default to the starting node of the flow if this value is omitted.
     */
    export function jumpTo(sessionId: string, event: IO.Event, flowName: string, nodeName?: string): Promise<void>
  }

  export namespace config {
    export function getModuleConfig(moduleId: string): Promise<any>

    /**
     * Returns the configuation values for the specified module and bot.
     * @param moduleId
     * @param botId
     */
    export function getModuleConfigForBot(moduleId: string, botId: string): Promise<any>

    /**
     * Returns the configuration options of Botpress
     */
    export function getBotpressConfig(): Promise<any>
  }

  /**
   * The Key Value Store is perfect to store any type of data as JSON.
   * @param botId - The ID of the bot
   * @param id - The element id
   * @returns A content element
   */
  export namespace kvs {
    /**
     * Returns the specified key as JSON object
     * @example bp.kvs.get('bot123', 'hello/whatsup')
     */
    export function get(botId: string, key: string, path?: string): Promise<any>

    /**
     * Saves the specified key as JSON object
     * @example bp.kvs.set('bot123', 'hello/whatsup', { msg: 'i love you' })
     */
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
    /**
     * Access the Ghost Service for a specific bot. Check the {@link ScopedGhostService} for the operations available on the scoped element.
     */
    export function forBot(botId: string): ScopedGhostService
  }

  export namespace cms {
    /**
     * Returns a single Content Element
     * @param botId - The ID of the bot
     * @param id - The element id
     * @returns A content element
     */
    export function getContentElement(botId: string, id: string): Promise<ContentElement>

    export function getContentElements(botId: string, ids: string[]): Promise<ContentElement[]>
    export function listContentElements(botId: string, contentTypeId?: string): Promise<ContentElement[]>
    export function getAllContentTypes(botId?: string): Promise<ContentType[]>
    /**
     * Use a specific content type renderer to parse the data and returns one or multiple payloads that may then be send to a user.
     * The channel is important since the data is displayed differently on different platforms.
     * @param contentTypeId - The ID of the content type
     * @param payload - The payload must match the data that the content type requires
     * @param channel - The name of the channel where the payload will be used
     * @returns An array of payloads
     */
    export function renderElement(contentTypeId: string, payload: any, channel: string): Promise<object[]>
    export function createOrUpdateContentElement(
      botId: string,
      contentTypeId: string,
      formData: string,
      contentElementId?: string
    ): Promise<string>
  }
}
