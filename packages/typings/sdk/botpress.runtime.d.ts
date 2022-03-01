/**
 * This is the Runtime SDk. Some methods are no longer available
 */
declare module 'botpress/runtime-sdk' {
  import Knex from 'knex'
  export interface KnexExtension {
    isLite: boolean
    location: string
    createTableIfNotExists(tableName: string, cb: Knex.KnexCallback): Promise<boolean>
    date: Knex.Date
    bool: Knex.Bool
    json: Knex.Json
    binary: Knex.Binary
    insertAndRetrieve<T>(
      tableName: string,
      data: {},
      returnColumns?: string | string[],
      idColumnName?: string,
      trx?: Knex.Transaction
    ): Promise<T>
  }

  export type KnexExtended = Knex & KnexExtension

  /**
   * Returns the current version of Botpress
   */
  export const version: string

  /**
   * This variable gives you access to the Botpress database via Knex.
   * When developing modules, you can use this to create tables and manage data
   * @example bp.database('srv_channel_users').insert()
   */
  export const database: KnexExtended

  /**
   * The logger instance is automatically scoped to the calling module
   * @example bp.logger.info('Hello!') will output: Mod[myModule]: Hello!
   */
  export const logger: Logger

  export interface LoggerEntry {
    botId?: string
    hostname?: string
    level: string
    scope: string
    message: string
    metadata: any
    timestamp: Date
  }

  export enum LoggerLevel {
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
    Critical = 'critical',
    Debug = 'debug'
  }

  export enum LogLevel {
    PRODUCTION = 0,
    DEV = 1,
    DEBUG = 2
  }

  export interface LoggerListener {
    (level: LogLevel, message: string, args: any): void
  }

  export interface Logger {
    forBot(botId: string): this
    attachError(error: unknown): this
    /**
     * Attaching an event to the log entry will display the associated logs in the Processing tab on the debugger
     */
    attachEvent(event: IO.Event): this
    persist(shouldPersist: boolean): this
    level(level: LogLevel): this
    noEmit(): this

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
    critical(message: string, metadata?: any): void
  }

  export namespace NLU {
    /**
     * idle : occures when there are no training sessions for a bot
     * done : when a training is complete
     * needs-training : when current chatbot model differs from training data
     * training-pending : when a training was launched, but the training process is not started yet
     * training: when a chatbot is currently training
     * canceled: when a user cancels a training and the training is being canceled
     * errored: when a chatbot failed to train
     */
    export type TrainingStatus =
      | 'idle'
      | 'done'
      | 'needs-training'
      | 'training-pending'
      | 'training'
      | 'canceled'
      | 'errored'
      | null

    export interface TrainingSession {
      key: string
      status: TrainingStatus
      language: string
      progress: number
    }

    export type EntityType = 'system' | 'pattern' | 'list'

    export interface EntityDefOccurrence {
      name: string
      synonyms: string[]
    }

    export interface EntityDefinition {
      id: string
      name: string
      type: EntityType
      sensitive?: boolean
      matchCase?: boolean
      examples?: string[]
      fuzzy?: number
      occurrences?: EntityDefOccurrence[]
      pattern?: string
    }

    export interface SlotDefinition {
      id: string
      name: string
      entities: string[]
      color: number
    }

    export interface IntentDefinition {
      name: string
      utterances: {
        [lang: string]: string[]
      }
      slots: SlotDefinition[]
      contexts: string[]
    }

    export interface Intent {
      name: string
      confidence: number
      context: string
    }

    export interface Entity {
      name: string
      type: string
      meta: EntityMeta
      data: EntityBody
    }

    export interface EntityBody {
      extras?: any
      value: any
      unit: string
    }

    export interface EntityMeta {
      sensitive: boolean
      confidence: number
      provider?: string
      source: string
      start: number
      end: number
      raw?: any
    }

    export interface Slot {
      name: string
      value: any
      source: any
      entity: Entity | null
      confidence: number
      start: number
      end: number
    }

    export type SlotCollection = Dic<Slot>

    export interface ContextPrediction {
      confidence: number
      oos: number
      intents: {
        label: string
        confidence: number
        slots: NLU.SlotCollection
        extractor: string
      }[]
    }
  }

  export namespace IO {
    export type EventDirection = 'incoming' | 'outgoing'
    export namespace WellKnownFlags {
      /** When this flag is active, the dialog engine will ignore those events */
      export const SKIP_DIALOG_ENGINE: symbol
      /** When this flag is active, the QNA module won't intercept this event */
      export const SKIP_QNA_PROCESSING: symbol
      /** When this flag is active, Botpress Native NLU will not process this event */
      export const SKIP_NATIVE_NLU: symbol
      /** When this flag is active, the Event State is persisted even if the dialog engine is skipped */
      export const FORCE_PERSIST_STATE: symbol
    }

    /**
     * These are the arguments required when creating a new {@link Event}
     */
    interface EventCtorArgs {
      type: string
      channel: string
      target: string
      direction: EventDirection
      preview?: string
      payload: any
      threadId?: string
      botId: string
      suggestions?: Suggestion[]
      credentials?: any
      nlu?: Partial<EventUnderstanding>
      incomingEventId?: string
      debugger?: boolean
      messageId?: string
      flags?: any
    }

    /**
     * A BotpressEvent is how conversational channels interact with Botpress. Events represent all the interactions
     * that make up a conversation. That means the different message types (text, image, buttons, carousels etc) but also
     * the navigational events (chat open, user typing) and contextual events (user returned home, order delivered).
     */
    export type Event = EventDestination & {
      /** A sortable unique identifier for that event (time-based) */
      readonly id: string
      /** Id of the corresponding message in the messaging server */
      messageId?: string
      /** The type of the event, i.e. image, text, timeout, etc */
      readonly type: string
      /** Is it (in)coming from the user to the bot or (out)going from the bot to the user? */
      readonly direction: EventDirection
      /** The channel-specific raw payload */
      readonly payload: any
      /** A textual representation of the event */
      readonly preview: string
      /** The date the event was created */
      readonly createdOn: Date
      readonly credentials?: any
      /** When false, some properties used by the debugger are stripped from the event before storing */
      debugger?: boolean
      activeProcessing?: ProcessingEntry
      /** Track processing steps during the lifetime of the event  */
      processing?: {
        [activity: string]: ProcessingEntry
      }
      /**
       * Check if the event has a specific flag
       * @param flag The flag symbol to verify. {@link IO.WellKnownFlags} to know more about existing flags
       * @returns Return whether or not the event has the flag
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

    interface ProcessingEntry {
      logs?: string[]
      errors?: EventError[]
      date?: Date
    }

    /**
     * The EventDestination includes all the required parameters to correctly dispatch the event to the correct target
     */
    export interface EventDestination {
      /** The channel of communication, i.e web, messenger, twillio */
      readonly channel: string
      /** Who will receive this message, usually a user id */
      readonly target: string
      /** The id of the bot on which this event is relating to  */
      readonly botId: string
      /** The id of the thread this message is relating to (only on supported channels) */
      readonly threadId?: string
    }

    export interface EventUnderstanding {
      readonly errored: boolean
      readonly modelId: string | undefined

      readonly predictions?: {
        [context: string]: {
          confidence: number
          oos: number
          intents: {
            label: string
            confidence: number
            slots: NLU.SlotCollection
            extractor: string
          }[]
        }
      }

      // election
      readonly entities?: NLU.Entity[]
      readonly intent?: NLU.Intent
      readonly intents?: NLU.Intent[]
      readonly ambiguous?: boolean /** Predicted intents needs disambiguation */
      readonly slots?: NLU.SlotCollection
      readonly spellChecked?: string

      // pre-prediction
      readonly detectedLanguage:
        | string
        | undefined /** Language detected from users input. If undefined, detection failed. */
      readonly language: string /** The language used for prediction */
      readonly includedContexts: string[]
      readonly ms: number
    }

    export interface IncomingEvent extends Event {
      /** Array of possible suggestions that the Decision Engine can take  */
      readonly suggestions?: Suggestion[]
      /** Contains data related to the state of the event */
      state: EventState
      /** Holds NLU extraction results (when the event is natural language) */
      readonly nlu?: EventUnderstanding
      /** The final decision that the Decision Engine took */
      readonly decision?: Suggestion
      /* HITL module has possibility to pause conversation */
      readonly isPause?: boolean
    }

    export interface OutgoingEvent extends Event {
      /* Id of event which is being replied to; only defined for outgoing events */
      readonly incomingEventId?: string
    }

    export interface Suggestion {
      /** Number between 0 and 1 indicating how confident the module is about its suggestion */
      confidence: number
      /** An array of the raw payloads to send as an answer */
      payloads: any[]
      /** The source (usually the name of the module or core component) this suggestion is coming from */
      source: string
      /** More specific details from the source of the suggestion, e.g. the name of the QnA */
      sourceDetails?: string
      /** The Decision Engine's decision about this suggestion */
      decision: {
        status: 'dropped' | 'elected'
        reason: string
      }
    }

    /**
     * This  object is used to store data which will be persisted on different timeframes. It allows you to easily
     * store and retrieve data for different kind of situations.
     */
    export interface EventState {
      /** Data saved as user attributes; retention policies in Botpress global config applies  */
      user: any
      /** Data is kept for the active session. Timeout configurable in the global config file */
      session: CurrentSession
      /** Data saved to this variable will be remembered until the end of the flow */
      temp: any
      /**
       * Variables in the bot object are shared to all users for a specific bot. It is read only,
       * meaning that changes are not automatically persisted. You need to use the setVariable option to change it.
       * There is a possible race condition since it is loaded each time a messages comes in. Update it wisely
       */
      bot: any
      /** Used internally by Botpress to keep the user's current location and upcoming instructions */
      context?: DialogContext
      /**
       * EXPERIMENTAL
       * This includes all the flow/nodes which were traversed for the current event
       */
      __stacktrace: JumpPoint[]
    }

    export interface EventError {
      type: 'action-execution' | 'dialog-transition' | 'dialog-engine' | 'hook-execution'
      stacktrace?: string
      actionName?: string
      actionArgs?: any
      hookName?: string
      destination?: string
      /** Represent the location where the error was triggered  */
      flowName?: string
      nodeName?: string
    }

    export interface JumpPoint {
      /** The name of the previous flow to return to when we exit a subflow */
      flow: string
      /** The name of the previous node to return to when we exit a subflow */
      node: string
      /** When a jump point is used, it will be removed from the list on the next transition */
      used?: boolean
      /** When true, the node targeted by this jump point will be executed from the start (instead of only transitions) */
      executeNode?: boolean
    }

    export interface DialogContext {
      /** The name of the previous flow to return to when we exit a subflow */
      previousFlow?: string
      /** The name of the previous node to return to when we exit a subflow */
      previousNode?: string
      /** The name of the current active node */
      currentNode?: string
      /** The name of the current active flow */
      currentFlow?: string
      /** An array of jump-points to return when we exit subflow */
      jumpPoints?: JumpPoint[]
      /** The instructions queue to be processed by the dialog engine */
      queue?: any
      /**
       * Indicate that the context has just jumped to another flow.
       * This is used to execute the target flow catchAll transitions.
       */
      hasJumped?: boolean
    }

    export interface CurrentSession {
      lastMessages: DialogTurnHistory[]
      nluContexts?: NluContext[]
      // Prevent warnings when using the code editor with custom properties
      [anyKey: string]: any
    }

    export type StoredEvent = {
      /** This ID is automatically generated when inserted in the DB  */
      readonly id: string
      readonly messageId?: string
      direction: EventDirection
      /** Outgoing events will have the incoming event ID, if they were triggered by one */
      incomingEventId?: string
      type: string
      sessionId: string
      workflowId?: string
      feedback?: number
      success?: boolean
      event: IO.Event
      createdOn: any
    } & EventDestination

    /**
     * They represent the contexts that will be used by the NLU Engine for the next messages for that chat session.
     *
     * The TTL (Time-To-Live) represents how long the contexts will be valid before they are automatically removed.
     * For example, the default value of `1` will listen for that context only once (the next time the user speaks).
     *
     * If a context was already present in the list, the higher TTL will win.
     */
    export interface NluContext {
      context: string
      /** Represent the number of turns before the context is removed from the session */
      ttl: number
    }

    export interface DialogTurnHistory {
      eventId: string
      incomingPreview: string
      replySource: string
      replyPreview: string
      replyConfidence: number
      replyDate: Date
    }

    /**
     * Call next with an error as first argument to throw an error
     * Call next with true as second argument to swallow the event (i.e. stop the processing chain)
     * Call next with no parameters or false as second argument to continue processing to next middleware
     * Call next with the last parameter as true to mark the middleware as "skipped" in the event processing
     */
    export type MiddlewareNextCallback = (error?: Error, swallow?: boolean, skipped?: boolean) => void

    /**
     * The actual middleware function that gets executed. It receives an event and expects to call next()
     * Not calling next() will result in a middleware timeout and will stop processing
     * If you intentionally want to stop processing, call `next(null, false)`
     */
    export type MiddlewareHandler = (event: Event, next: MiddlewareNextCallback) => void

    /**
     * The Middleware Definition is used by the event engine to register a middleware in the chain. The order in which they
     * are executed is important, since some may require previous processing, while others can swallow the events.
     * Incoming chain is executed when the bot receives an event.
     * Outgoing chain is executed when an event is sent to a user
     */
    export interface MiddlewareDefinition {
      /** The internal name used to identify the middleware in configuration files */
      name: string
      description: string
      /** The position in which this middleware should intercept messages in the middleware chain. */
      order: number
      /** A method with two parameters (event and a callback) used to handle the event */
      handler: MiddlewareHandler
      /** Indicates if this middleware should act on incoming or outgoing events */
      direction: EventDirection
      /**
       * Allows to specify a timeout for the middleware instead of using the middleware chain timeout value
       * @example '500ms', '2s', '5m'
       * @default '2s'
       * */
      timeout?: string
    }

    export interface EventConstructor {
      (args: EventCtorArgs): Event
    }

    export const Event: EventConstructor
  }

  export interface User {
    id: string
    channel: string
    createdOn: Date
    updatedOn: Date
    attributes: any
    otherChannels?: User[]
  }

  /**
   * The direction of the event. An incoming event will register itself into the incoming middleware chain.
   * An outgoing event will register itself into the outgoing middleware chain.
   * @see MiddlewareDefinition to learn more about middleware.
   */
  export type EventDirection = 'incoming' | 'outgoing'

  export interface UpsertOptions {
    /** Whether or not to record a revision @default true */
    recordRevision?: boolean
    /** When enabled, files changed on the database are synced locally so they can be used locally (eg: require in actions) @default false */
    syncDbToDisk?: boolean
    /** This is only applicable for bot-scoped ghost. When true, the lock status of the bot is ignored. @default false */
    ignoreLock?: boolean
  }

  export interface DirectoryListingOptions {
    excludes?: string | string[]
    includeDotFiles?: boolean
    sortOrder?: SortOrder & { column: 'filePath' | 'modifiedOn' }
  }

  export interface ScopedGhostService {
    readFileAsBuffer(rootFolder: string, file: string): Promise<Buffer>
    readFileAsString(rootFolder: string, file: string): Promise<string>
    readFileAsObject<T>(rootFolder: string, file: string): Promise<T>
    /**
     * List all the files matching the ending pattern in the folder.
     * DEPRECATE WARNING: exclude and includedDotFiles must be defined in options in future versions
     * @example bp.ghost.forBot('welcome-bot').directoryListing('./questions', '*.json')
     * @param rootFolder - Folder relative to the scoped parent
     * @param fileEndingPattern - The pattern to match. Don't forget to include wildcards!
     * @param @deprecated exclude - The pattern to match excluded files.
     * @param @deprecated includeDotFiles - Whether or not to include files starting with a dot (normally disabled files)
     */
    directoryListing(
      rootFolder: string,
      fileEndingPattern: string,
      exclude?: string | string[],
      includeDotFiles?: boolean,
      options?: DirectoryListingOptions
    ): Promise<string[]>
    /**
     * Starts listening on all file changes (deletion, inserts and updates)
     * `callback` will be called for every change
     * To stop listening, call the `remove()` method of the returned ListenHandle
     */
    onFileChanged(callback: (filePath: string) => void): ListenHandle
    fileExists(rootFolder: string, file: string): Promise<boolean>
  }

  export interface KvsService {
    /**
     * Returns the specified key as JSON object
     * @example bp.kvs.forBot('bot123').get('hello/whatsup')
     */
    get(key: string, path?: string): Promise<any>

    /**
     * Saves the specified key as JSON object
     * @example bp.kvs.forBot('bot123').set('hello/whatsup', { msg: 'i love you' })
     * @param expiry The key will expire in X (eg: 10m, 1d, 30 days) - refer to https://www.npmjs.com/package/ms for options
     */
    set(key: string, value: any, path?: string, expiry?: string): Promise<void>

    /**
     * Deletes the specified key
     * @example bp.kvs.forBot('bot123').delete('hello/whatsup')
     */
    delete(key: string): Promise<void>

    /**
     * Whether or not the specified key exists
     * @example bp.kvs.forBot('bot123').exists('hello/whatsup')
     */
    exists(key: string): Promise<boolean>
    /**
     * @deprecated Use bp.kvs.forBot().set() and set an expiry as the last parameter
     */
    setStorageWithExpiry(key: string, value, expiry?: string)
    /**
     * @deprecated Use bp.kvs.forBot().get() which handles expiry automatically
     */
    getStorageWithExpiry(key: string)
    getConversationStorageKey(sessionId: string, variable: string): string
    getUserStorageKey(userId: string, variable: string): string
    getGlobalStorageKey(variable: string): string
    removeStorageKeysStartingWith(key): Promise<void>
  }

  export interface ListenHandle {
    /** Stops listening from the event */
    remove(): void
  }

  /**
   * The configuration definition of a bot.
   */
  export interface BotConfig {
    $schema?: string
    id: string
    name: string
    description?: string
    category?: string
    details: BotDetails
    author?: string
    disabled?: boolean
    private?: boolean
    version: string
    imports: {
      /** Defines the list of content types supported by the bot */
      contentTypes: string[]
    }
    messaging?: MessagingConfig
    converse?: ConverseConfig
    dialog?: BotDialogConfig
    logs?: BotLogsConfig
    defaultLanguage: string
    languages: string[]
    locked: boolean
    pipeline_status: BotPipelineStatus

    /**
     * constant number used to seed nlu random number generators
     * if not set, seed is computed from botId
     */
    nluSeed?: number
    nluModels?: {
      [lang: string]: string
    }
    qna: {
      disabled: boolean
    }

    cloud?: CloudConfig
  }

  export interface CloudConfig {
    oauthUrl: string
    clientId: string
    clientSecret: string
  }

  export type Pipeline = Stage[]

  export type StageAction = 'promote_copy' | 'promote_move'

  export interface Stage {
    id: string
    label: string
    action: StageAction
  }

  export interface BotPipelineStatus {
    current_stage: {
      promoted_by: string
      promoted_on: Date
      id: string
    }
    stage_request?: {
      requested_on: Date
      expires_on?: Date
      message?: string
      status: string
      requested_by: string
      id: string
      approvals?: StageRequestApprovers[]
    }
  }

  export interface StageRequestApprovers {
    email: string
    strategy: string
  }

  export interface BotDetails {
    website?: string
    phoneNumber?: string
    termsConditions?: string
    privacyPolicy?: string
    emailAddress?: string
    avatarUrl?: string
    coverPictureUrl?: string
  }

  export interface BotLogsConfig {
    expiration: string
  }

  /**
   * Configuration definition of Dialog Sessions
   */
  export interface BotDialogConfig {
    /** The interval until a session context expires */
    timeoutInterval: string
    /** The interval until a session expires */
    sessionTimeoutInterval: string
  }

  export interface MessagingConfig {
    /**
     * Client id used to identify the bot on the messaging server
     */
    id: string
    /**
     * Client token used to authenticate requests made to the messaging server
     */
    token: string
    /**
     * Configurations of channels to be sent to the messaging server
     * You can find more about channel configurations here : https://botpress.com/docs/channels/faq
     */
    channels: { [channelName: string]: any }
  }

  /**
   * Configuration file definition for the Converse API
   */
  export interface ConverseConfig {
    /**
     * The timeout of the converse API requests
     * @default 5s
     */
    timeout: string
    /**
     * The text limitation of the converse API requests
     * @default 360
     */
    maxMessageLength: number
    /**
     * Number of milliseconds that the converse API will wait to buffer responses
     * @default 250
     */
    bufferDelayMs: number
    /**
     * Whether or not you want to expose public converse API. See docs here https://botpress.com/docs/channels/converse#public-api
     * @default ture
     */
    enableUnsecuredEndpoint: boolean
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
    /** The computed form data that contains the interpreted data. */
    computedData: object
    /** The textual representation of the Content Element, for each supported languages  */
    previews: object
    createdOn: Date
    modifiedOn: Date
    createdBy: string
  }

  /**
   * A Content Type describes a grouping of Content Elements @see ContentElement sharing the same properties.
   * They can describe anything and everything – they most often are domain-specific to your bot. They also
   * tells botpress how to display the content on various channels
   */
  export interface ContentType {
    id: string
    title: string
    description: string
    /**
     * Hiding content types prevents users from adding these kind of elements via the Flow Editor.
     * They are still visible in the Content Manager, and it's still possible to use these elements by specifying
     * their name as a property "contentType" to ContentPickerWidget.
     */
    hidden: boolean
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
  }

  export type CustomContentType = Omit<Partial<ContentType>, 'id'> & {
    /** A custom component must extend a builtin type */
    extends: string
  }

  /**
   * The flow is used by the dialog engine to answer the user and send him to the correct destination
   */
  export interface Flow {
    name: string
    /** Friendly name to display in the flow view */
    label?: string
    description?: string
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

  export interface Option {
    value: string
    label: string
  }

  export type FlowNodeType =
    | 'standard'
    | 'skill-call'
    | 'listen'
    | 'say_something'
    | 'success'
    | 'failure'
    | 'trigger'
    | 'execute'
    | 'router'
    | 'action'

  export type FlowNode = {
    id?: string
    name: string
    type?: FlowNodeType
    timeoutNode?: string
    flow?: string
    /** Used internally by the flow editor */
    readonly lastModified?: Date
  } & NodeActions

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
    /** A JS expression that is evaluated to determine if it should send the user to the specified node */
    condition: string
    /** The destination node */
    node: string
  }

  export interface MultiLangText {
    [lang: string]: string
  }

  export type FormDataField = any

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
    /** For node of type say_something, this contains the element to render */
    content?: {
      contentType: string
      /** Every properties required by the content type, including translations */
      formData: object
    }
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
   * Simple interface to use when paging is required
   */
  export interface Paging {
    /** The index of the first element */
    start: number
    /** How many elements should be returned */
    count: number
  }

  export interface RenderPipeline {
    text: typeof experimental.render.text
    image: typeof experimental.render.image
    card: typeof experimental.render.card
    carousel: typeof experimental.render.carousel
    choice: typeof experimental.render.choice
    buttonSay: typeof experimental.render.buttonSay
    buttonUrl: typeof experimental.render.buttonUrl
    buttonPostback: typeof experimental.render.buttonPostback
    option: typeof experimental.render.option
  }

  export interface Content {
    type: string
  }

  export interface TextContent extends Content {
    type: 'text'
    text: string | MultiLangText
    markdown?: boolean
  }

  export interface ImageContent extends Content {
    type: 'image'
    image: string
    title?: string | MultiLangText
  }

  export interface AudioContent extends Content {
    type: 'audio'
    audio: string
    title?: string | MultiLangText
  }

  export interface VideoContent extends Content {
    type: 'video'
    video: string
    title?: string | MultiLangText
  }

  export interface CarouselContent extends Content {
    type: 'carousel'
    items: CardContent[]
  }

  export interface CardContent extends Content {
    type: 'card'
    title: string | MultiLangText
    subtitle?: string | MultiLangText
    image?: string
    actions: ActionButton[]
  }

  export interface LocationContent extends Content {
    type: 'location'
    latitude: number
    longitude: number
    address?: string | MultiLangText
    title?: string | MultiLangText
  }

  export interface FileContentType extends Content {
    type: 'file'
    file: string
    title?: string | MultiLangText
  }

  export enum ButtonAction {
    SaySomething = 'Say something',
    OpenUrl = 'Open URL',
    Postback = 'Postback'
  }

  export interface ActionButton {
    action: ButtonAction
    title: string
  }

  export interface ActionSaySomething extends ActionButton {
    text: string | MultiLangText
  }

  export interface ActionOpenURL extends ActionButton {
    url: string
  }

  export interface ActionPostback extends ActionButton {
    payload: string
  }

  export interface ChoiceContent extends Content {
    type: 'single-choice'
    text: string | MultiLangText
    choices: ChoiceOption[]
  }

  export interface ChoiceOption {
    title: string | MultiLangText
    value: string
  }

  export interface DropdownContent extends Content {
    type: 'dropdown'
    message: string | MultiLangText
    options: DropdownOption[]
  }

  export interface DropdownOption {
    label: string | MultiLangText
    value: string
  }

  ////////////////
  //////// API
  ////////////////

  /**
   * Search parameters when querying content elements
   */
  export interface SearchParams {
    /** Search in elements id and form data */
    searchTerm?: string
    /** Returns the amount of elements from the starting position  */
    from: number
    count: number
    /** Only returns the items matching these ID */
    ids?: string[]
    /** An array of columns with direction to sort results */
    sortOrder?: SortOrder[]
    /** Apply a filter to a specific field (instead of the 'search all' field) */
    filters?: Filter[]
  }

  export interface EventSearchParams {
    /** Returns the amount of elements from the starting position  */
    from?: number
    count?: number
    /** An array of columns with direction to sort results */
    sortOrder?: SortOrder[]
  }

  export interface Filter {
    /** The name of the column to filter on */
    column: string
    /** The value to filter (line %value%) */
    value: string
  }

  export interface SortOrder {
    /** The name of the column  */
    column: string
    /** Is the sort order ascending or descending? Asc by default */
    desc?: boolean
  }

  export interface RedisLock {
    /** Free the lock so other nodes can request it */
    unlock(): Promise<void>
    /** Extend the duration of the lock for the node owning it */
    extend(duration: number): Promise<void>
  }

  /**
   * Events is the base communication channel of the bot. Messages and payloads are a part of it,
   * and it is the only way to receive or send information. Each event goes through the whole middleware chain (incoming or outgoing)
   * before being received by either the bot or the user.
   */
  export namespace events {
    /**
     * Register a new middleware globally. They are sorted based on their declared order each time a new one is registered.
     * @param middleware - The middleware definition to register
     */
    export function registerMiddleware(middleware: IO.MiddlewareDefinition): void

    /** Removes the specified middleware from the chain. This is mostly used in case of a module being reloaded */
    export function removeMiddleware(middlewareName): void

    /**
     * Send an event through the incoming or outgoing middleware chain
     * @param event - The event to send
     */
    export function sendEvent(event: IO.Event): Promise<void>

    /**
     * Reply easily to any received event. It accepts an array of payloads
     * and will send a complete event with each payloads. It is often paired with
     * {@link cms.renderElement} to generate payload for a specific content type
     *
     * @param eventDestination - The destination to identify the target
     * @param payloads - One or multiple payloads to send
     */
    export function replyToEvent(eventDestination: IO.EventDestination, payloads: any[], incomingEventId?: string): void

    /**
     * Return the state of the incoming queue. True if there are any events(messages)
     * from the user waiting in the queue.
     * @param event - Current event in the action context, used to identify the queue
     */
    export function isIncomingQueueEmpty(event: IO.IncomingEvent): boolean

    /**
     * When Event Storage is enabled, you can use this API to query data about stored events. You can use multiple fields
     * for your query, but at least one is required.
     *
     * @param fields - One or multiple fields to add to the search query
     * @param searchParams - Additional parameters for the query, like ordering, number of rows, etc.
     */
    export function findEvents(
      fields: Partial<IO.StoredEvent>,
      searchParams?: EventSearchParams
    ): Promise<IO.StoredEvent[]>

    /**
     * When Event Storage is enabled, you can use this API to update an event. You can use multiple fields
     * for your query, but at least one is required.
     *
     * @param id - The ID of the event to update
     * @param fields - Fields to update on the event
     */
    export function updateEvent(id: string, fields: Partial<IO.StoredEvent>): Promise<void>

    /**
     * Register the user feedback for a specific event. The type property is used to increment associated metrics
     * @param incomingEventId - The ID of the first event of the conversation
     * @param target - The ID of the user
     * @param feedback Either 1 or -1
     * @param type - For now, only supports qna & workflow
     * @return true if feedback was successfully saved
     */
    export function saveUserFeedback(
      incomingEventId: string,
      target: string,
      feedback: number,
      type?: string
    ): Promise<boolean>
  }

  export type GetOrCreateResult<T> = Promise<{
    created: boolean
    result: T
  }>

  export namespace users {
    /**
     * Returns an existing user or create a new one with the specified keys
     */
    export function getOrCreateUser(channel: string, userId: string, botId?: string): GetOrCreateResult<User>

    /**
     * Merge the specified attributes to the existing attributes of the user
     * @deprecated Please mutate `event.state.user` directly instead
     */
    export function updateAttributes(channel: string, userId: string, attributes: any): Promise<void>

    /**
     * Overwrite all the attributes of the user with the specified payload
     * @deprecated Please mutate `event.state.user` directly instead
     */
    export function setAttributes(channel: string, userId: string, attributes: any): Promise<void>
    export function getAllUsers(paging?: Paging): Promise<any>
    export function getUserCount(): Promise<any>
    export function getAttributes(channel: string, userId: string): Promise<any>
  }

  /**
   * A state is a mutable object that contains properties used by the dialog engine during a conversation.
   * Properties like "nickname" or "nbOfConversations" are used during a conversation to execute flow logic. e.g. Navigating to a certain node when a condition is met.
   */
  export type State = any

  /**
   * The dialog engine is what processes conversations. It orchestrates the conversational flow logic.
   */
  export namespace dialog {
    /**
     * Create a session Id from an Event Destination
     * @param eventDestination The event used to create the Dialog Session Id
     */
    export function createId(eventDestination: IO.EventDestination): string
    /**
     * Calls the dialog engine to start processing an event.
     * @param event The event to be processed by the dialog engine
     */
    export function processEvent(sessionId: string, event: IO.IncomingEvent): Promise<IO.IncomingEvent>
    /**
     * Deletes a session
     * @param sessionId The Id of the session to delete
     * @param botId The Id of the bot to which the session is tied
     */
    export function deleteSession(sessionId: string, botId: string): Promise<void>

    /**
     * Jumps to a specific flow and optionally a specific node. This is useful when the default flow behavior needs to be bypassed.
     * @param sessionId The Id of the the current Dialog Session. If the session doesn't exists, it will be created with this Id.
     * @param event The event to be processed
     * @param flowName The name of the flow to jump to
     * @param nodeName The name of the optional node to jump to.
     * The node will default to the starting node of the flow if this value is omitted.
     */
    export function jumpTo(
      sessionId: string,
      event: IO.IncomingEvent,
      flowName: string,
      nodeName?: string
    ): Promise<void>
  }

  export namespace config {
    /**
     * Returns the configuration options of Botpress
     */
    export function getBotpressConfig(): Promise<any>
  }

  /**
   * The distributed namespace uses Redis to distribute commands to every node
   */
  export namespace distributed {
    /**
     * When a single node must process data from a shared source, call this method to obtain an exclusive lock.
     * You can then call lock.extend() to keep it longer, or lock.unlock() to release it
     * @param resource Name of the resource to lock
     * @param duration the initial duration
     * @return undefined if another node already has obtained the lock
     */
    export function acquireLock(resource: string, duration: number): Promise<RedisLock | undefined>

    /**
     * Forcefully clears any trace of the lock from the redis store. It doesn't clear the lock from the node which had it.
     * Ensure that a broadcasted job took care of cancelling it before.
     * @param resource
     * @return true if an existing lock was deleted
     */
    export function clearLock(resource: string): Promise<boolean>

    /**
     * This method returns a function that can then be called to broadcast the message to every node
     * @param fn The job that will be executed on all nodes
     * @param T The return type of the returned function
     *
     * @example const distributeToAll: Function = await bp.distributed.broadcast<void>(_localMethod)
     * @example const _localMethod = (param1, param2): Promise<void> { }
     * @example distributeToAll('send to all nodes', 'other info') // Every node will execute this method
     */
    export function broadcast<T>(fn: Function): Promise<Function>
  }

  /**
   * The Key Value Store is perfect to store any type of data as JSON.
   */
  export namespace kvs {
    /**
     * Access the KVS Service for a specific bot. Check the {@link ScopedGhostService} for the operations available on the scoped element.
     */
    export function forBot(botId: string): KvsService
    /**
     * Access the KVS Service globally. Check the {@link ScopedGhostService} for the operations available on the scoped element.
     */
    export function global(): KvsService

    /**
     * Returns the specified key as JSON object
     * @example bp.kvs.get('bot123', 'hello/whatsup')
     * @deprecated will be removed, use global or forBot
     */
    export function get(botId: string, key: string, path?: string): Promise<any>

    /**
     * Saves the specified key as JSON object
     * @example bp.kvs.set('bot123', 'hello/whatsup', { msg: 'i love you' })
     * @deprecated will be removed, use global or forBot
     */
    export function set(botId: string, key: string, value: any, path?: string, expiry?: string): Promise<void>

    /**
     * @deprecated will be removed, use global or forBot
     */
    export function setStorageWithExpiry(botId: string, key: string, value, expiry?: string)

    /**
     * @deprecated will be removed, use global or forBot
     */
    export function getStorageWithExpiry(botId: string, key: string)

    /**
     * @deprecated will be removed, use global or forBot
     */
    export function getConversationStorageKey(sessionId: string, variable: string): string

    /**
     * @deprecated will be removed, use global or forBot
     */
    export function getUserStorageKey(userId: string, variable: string): string

    /**
     * @deprecated will be removed, use global or forBot
     */
    export function getGlobalStorageKey(variable: string): string

    /**
     * @deprecated will be removed, use global or forBot
     */
    export function removeStorageKeysStartingWith(key): Promise<void>
  }

  export namespace bots {
    export function getAllBots(): Promise<Map<string, BotConfig>>
    export function getBotById(botId: string): Promise<BotConfig | undefined>
  }

  export namespace ghost {
    /**
     * Access the Ghost Service for a specific bot. Check the {@link ScopedGhostService} for the operations available on the scoped element.
     */
    export function forBot(botId: string): ScopedGhostService
    /**
     * Access the Ghost Service scoped at the root of all bots
     */
    export function forBots(): ScopedGhostService
    /**
     * Access the Ghost Service globally. Check the {@link ScopedGhostService} for the operations available on the scoped element.
     */
    export function forGlobal(): ScopedGhostService
    /**
     * Access the BPFS at the root of the data folder
     */
    export function forRoot(): ScopedGhostService
  }

  export namespace cms {
    /**
     * Returns a single Content Element
     * @param botId - The ID of the bot
     * @param id - The element id
     * @param language - If language is set, it will return only the desired language with the base properties
     * @returns A content element
     */
    export function getContentElement(botId: string, id: string, language?: string): Promise<ContentElement>

    export function getContentElements(botId: string, ids: string[], language?: string): Promise<ContentElement[]>

    /**
     *
     * @param botId The ID of the bot
     * @param contentTypeId Filter entries on that specific content type
     * @param searchParams Additional search parameters (by default, returns 50 elements)
     * @param language When specified, only that language is returned with the original property (ex: text$en becomes text)
     */
    export function listContentElements(
      botId: string,
      contentTypeId?: string,
      searchParams?: SearchParams,
      language?: string
    ): Promise<ContentElement[]>

    export function getAllContentTypes(botId: string): Promise<ContentType[]>
    /**
     * Content Types can produce multiple payloads depending on the channel and the type of message. This method can generate
     * payloads for a specific content element or generate them for a custom payload.
     * They can then be sent to the event engine, which sends them through the outgoing middlewares, straight to the user
     *
     * @param contentId - Can be a ContentType (ex: "builtin_text") or a ContentElement (ex: "!builtin_text-s6x5c6")
     * @param args - Required arguments by the content type (or the content element)
     * @param eventDestination - The destination of the payload (to extract the botId and channel)
     *
     * @example const eventDestination = { target: 'user123', botId: 'welcome-bot', channel: 'web', threadId: 1 }
     * @example const payloads = await bp.cms.renderElement('builtin_text', {type: 'text', text: 'hello'}, eventDestination)
     * @example await bp.events.replyToEvent(eventDestination, payloads)
     *
     * @returns An array of payloads
     */
    export function renderElement(
      contentId: string,
      args: any,
      eventDestination: IO.EventDestination
    ): Promise<object[]>

    /**
     * Mustache template to render. Can contain objects, arrays, strings.
     * @example '{{en}}', ['{{nested.de}}'], {notSoNested: '{{fr}}'}
     */
    export type TemplateItem = Object | Object[] | string[] | string

    /**
     * Render a template using Mustache template rendering.
     * Use recursive template rendering to extract nested templates.
     *
     * @param item TemplateItem to render
     * @param context Variables to use for the template rendering
     */
    export function renderTemplate(item: TemplateItem, context): TemplateItem
  }

  /**
   * Utility security-related features offered to developers
   * to create more secure extensions.
   */
  export namespace security {
    /**
     * Creates a message signature, which can be used as proof that the message was created on Botpress backend
     * You can call this method twice to verify the authenticity of a message
     */
    export function getMessageSignature(message: string): Promise<string>
  }

  /**
   * These features are subject to change and should not be relied upon.
   * They will eventually be either removed or moved in another namespace
   */
  export namespace experimental {
    /**
     * WARNING : these payloads do not produce typing indicators yet!
     */
    export namespace render {
      /**
       * Renders a text element
       * @param text Text to show
       * @param markdown Indicates whether to use markdown
       */
      export function text(text: string | MultiLangText, markdown?: boolean): TextContent

      /**
       * Renders an image element
       * @param url Url of the image to send
       * @param caption Caption to appear alongside your image
       */
      export function image(url: string, caption?: string | MultiLangText): ImageContent

      /**
       * Renders an audio element
       * @param url Url of the audio file to send
       * @param caption Caption to appear alongside your audio
       */
      export function audio(url: string, caption?: string | MultiLangText): AudioContent

      /**
       * Renders a video element
       * @param url Url of the video file to send
       * @param caption Caption to appear alongside your video
       */
      export function video(url: string, caption?: string | MultiLangText): VideoContent

      /**
       * Renders a location element
       * @param latitude Latitude of location in decimal degrees
       * @param longitude Longitude of location in decimal degrees
       * @param address Street adress associated with location
       * @param title Explanatory title for this location
       */
      export function location(
        latitude: number,
        longitude: number,
        address?: string | MultiLangText,
        title?: string | MultiLangText
      ): LocationContent

      /**
       * Renders a carousel element
       * @param cards The cards of the carousel
       * @example
       * bp.render.carousel(bp.render.card('my card'), bp.render.card('my card 2'))
       */
      export function carousel(...cards: CardContent[]): CarouselContent

      /**
       * Renders a card element
       * @param title The title of your card
       * @param image The url of a pictured shown in your card
       * @param subtitle A subtitle below your image
       * @param buttons Action buttons for your card
       * @example
       * bp.render.card('my card', 'https://mysite.com/mypicture.png', 'an interesting subtitle', bp.render.buttonSay('hello'))
       */
      export function card(
        title: string | MultiLangText,
        image?: string,
        subtitle?: string | MultiLangText,
        ...buttons: ActionButton[]
      ): CardContent

      /**
       * Renders an action button used to send a message to the conversation
       * @param title Title shown on the button
       * @param text Message to send
       */
      export function buttonSay(title: string, text: string | MultiLangText): ActionSaySomething

      /**
       * Renders an action button for opening urls
       * @param title Title shown on the button
       * @param text Url to open
       */
      export function buttonUrl(title: string, url: string): ActionOpenURL

      /**
       * Renders an action button for posting content
       * @param title Title shown on the button
       * @param payload Payload to post
       */
      export function buttonPostback(title: string, payload: string): ActionPostback

      /**
       * Render a choice element
       * @param text Message to ask to the user
       * @param choices Choices that the user can select
       * @example
       * bp.render.choice("Yes or no?", bp.render.option('yes'), bp.render.option('no'))
       */
      export function choice(text: string | MultiLangText, ...choices: ChoiceOption[]): ChoiceContent

      /**
       * Renders an option for a choice element
       * @param value Value associated with the option
       * @param title Text to shown to the user (has no impact on the processing).
       * If not provided the value will be shown by default
       */
      export function option(value: string, title?: string): ChoiceOption

      /**
       * Translates a content element to a specific language
       * @param content Content element to be translated
       * @param lang Language code in which to translate (en, fr, es, etc.)
       * @example
       * const content = bp.render.text({ en: 'hello!', fr: 'salut!' })
       * // content.text : { en: 'hello!', fr: 'salut!' }
       * const translated = bp.render.translate(content, 'fr')
       * // content.text : 'salut!'
       */
      export function translate<T extends Content>(content: T, lang: string): T

      /**
       * Renders a content element's {{mustaches}} using the provided context
       * @param content The content element to be rendered
       * @param context The context used to filled the {{mustaches}}
       * @example
       * const content = bp.render.text('{{user.name}} is awesome!')
       * // content.text : '{{user.name}} is awesome!'
       * const payload = bp.render.template(content, { user: { name: 'bob' } })
       * // payload.text : 'bob is awesome!'
       */
      export function template<T extends Content>(content: T, context: any): T

      /**
       * Creates a pipeline for rendering, translating and templating content
       * @param lang Language to use for translation
       * @param context Context to use for templating
       * @example
       * // Doing all this
       * const content = bp.render.text({ en: 'hello {{user.name}}', fr: 'salut {{user.name}}' })
       * const translated = bp.render.translate(content, 'fr')
       * const templated = bp.render.template(translated, { user: { name: 'bob' } })
       *
       * // Can be replaced by this
       * const content = bp.render
       *   .pipeline('fr', { user: { name: 'bob' } })
       *   .text({ en: 'hello {{user.name}}', fr: 'salut {{user.name}}' })
       *
       * // You can reuse the same pipeline for multiple contents
       * const render = bp.render.pipeline('fr', { user: { name: 'bob', age: 43, pin: 3030 } })
       * const text1 = render.text({ en: 'hello {{user.name}}', fr: 'salut {{user.name}}' })
       * const text2 = render.text({ en: 'age : {{user.age}}', fr: 'âge : {{user.age}}' })
       * const text3 = render.text('PIN : {{user.pin}}')
       */
      export function pipeline(lang: string, context: any): RenderPipeline
    }
  }
}
