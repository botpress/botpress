/**
 * This is the official Botpress SDK, designed to help our fellow developers to create wonderful modules and
 * extend the world's best chatbot functionality to make it even better! Your module will receives an instance of
 * this SDK (Yes, all those beautiful features!) to kick start your development. Missing something important?
 * Please let us know in our official Github Repo!
 */
declare module 'botpress/sdk' {
  import { NextFunction, Request, Response, Router } from 'express'
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

  export interface Incident {
    id: string
    ruleName: string
    hostName: string
    startTime: Date
    endTime?: Date
    triggerValue: number
  }

  export type StrategyUser = {
    id?: number
    password?: string
    salt?: string
  } & UserInfo

  export interface UserInfo {
    email: string
    strategy: string
    createdOn?: string
    updatedOn?: string
    attributes: any
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
    attachError(error: Error): this
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

  export type ElementChangedAction = 'create' | 'update' | 'delete'

  /**
   * The Module Entry Point is used by the module loader to bootstrap the module. It must be present in the index.js file
   * of the module. The path to the module must also be specified in the global botpress config.
   */
  export interface ModuleEntryPoint {
    /** Additional metadata about the module */
    definition: ModuleDefinition
    /** An array of the flow generators used by skills in the module */
    skills?: Skill[]
    /** An array of available bot templates when creating a new bot */
    botTemplates?: BotTemplate[]
    translations?: { [lang: string]: object }
    /** List of new conditions that the module can register */
    dialogConditions?: Condition[]
    /** Called once the core is initialized. Usually for middlewares / database init */
    onServerStarted?: (bp: typeof import('botpress/sdk')) => Promise<void>
    /** This is called once all modules are initialized, usually for routing and logic */
    onServerReady?: (bp: typeof import('botpress/sdk')) => Promise<void>
    onBotMount?: (bp: typeof import('botpress/sdk'), botId: string) => Promise<void>
    onBotUnmount?: (bp: typeof import('botpress/sdk'), botId: string) => Promise<void>
    /**
     * Called when the module is unloaded, before being reloaded
     * onBotUnmount is called for each bots before this one is called
     */
    onModuleUnmount?: (bp: typeof import('botpress/sdk')) => Promise<void>
    /**
     * Called when a topic is being changed.
     * If oldName is not set, then the topic `newName` is being created
     * If newName is not set, then the topic `oldName` is being deleted
     */
    onTopicChanged?: (
      bp: typeof import('botpress/sdk'),
      botId: string,
      oldName?: string,
      newName?: string
    ) => Promise<void>
    onFlowChanged?: (bp: typeof import('botpress/sdk'), botId: string, flow: Flow) => Promise<void>
    onFlowRenamed?: (
      bp: typeof import('botpress/sdk'),
      botId: string,
      previousFlowName: string,
      newFlowName: string
    ) => Promise<void>
    /**
     * This method is called whenever a content element is created, updated or deleted.
     * Modules can act on these events if they need to update references, for example.
     */
    onElementChanged?: (
      bp: typeof import('botpress/sdk'),
      botId: string,
      action: ElementChangedAction,
      element: ContentElement,
      oldElement?: ContentElement
    ) => Promise<void>
  }

  /**
   * Identifies new Bot Template that can be used to speed up the creation of a new bot without
   * having to start from scratch
   */
  export interface BotTemplate {
    /** Used internally to identify this template  */
    id: string
    /** The name that will be displayed in the bot template menu */
    name: string
    /** Gives a short description of your module, which is displayed once the template is selected */
    desc: string
    /** These are used internally by Botpress when they are registered on startup */
    readonly moduleId?: string
    readonly moduleName?: string
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
    /**
     * The name displayed on the menu
     * @deprecated Set the property "fullName" in the translations file for the desired language
     */
    menuText?: string
    /** Optionally specify a link to your page or github repo */
    homepage?: string
    /** Whether or not the module is likely to change */
    experimental?: boolean
  }

  /**
   * Skills are loaded automatically when the bot is started. They must be in the module's definition to be loaded.
   * Each skills must have a flow generator and a view with the same name (skillId)
   */
  export interface Skill {
    /** An identifier for the skill. Use only a-z_- characters. */
    id: string
    /** The name that will be displayed in the toolbar for the skill */
    name: string
    /** An icon to identify the skill */
    icon?: string | any
    /** Name of the parent module. This field is filled automatically when they are loaded */
    readonly moduleName?: string
    /**
     * When adding a new skill on the Flow Editor, the flow is constructed dynamically by this method
     *
     * @param skillData Provided by the skill view, those are fields edited by the user on the Flow Editor
     * @param metadata Some metadata automatically provided, like the bot id
     * @return The method should return
     */
    flowGenerator: (skillData: any, metadata: FlowGeneratorMetadata) => Promise<FlowGenerationResult>
  }

  export interface FlowGeneratorMetadata {
    botId: string
    isOneFlow?: boolean
  }

  export interface ModulePluginEntry {
    entry: 'WebBotpressUIInjection'
    position: 'overlay'
  }

  export interface ModuleViewOptions {
    stretched: boolean
  }

  export class RealTimePayload {
    readonly eventName: string
    readonly payload: any
    constructor(eventName: string, payload: any)
    public static forVisitor(visitorId: string, eventName: string, payload: any): RealTimePayload
    public static forAdmins(eventName: string, payload: any): RealTimePayload
  }

  export namespace MLToolkit {
    export namespace FastText {
      export type TrainCommand = 'supervised' | 'quantize' | 'skipgram' | 'cbow'
      export type Loss = 'hs' | 'softmax'

      export interface TrainArgs {
        lr: number
        dim: number
        ws: number
        epoch: number
        minCount: number
        minCountLabel: number
        neg: number
        wordNgrams: number
        loss: Loss
        model: string
        input: string
        bucket: number
        minn: number
        maxn: number
        thread: number
        lrUpdateRate: number
        t: number
        label: string
        pretrainedVectors: string
        qout: boolean
        retrain: boolean
        qnorm: boolean
        cutoff: number
        dsub: number
      }

      export interface PredictResult {
        label: string
        value: number
      }

      export interface Model {
        cleanup: () => void
        trainToFile: (method: TrainCommand, modelPath: string, args: Partial<TrainArgs>) => Promise<void>
        loadFromFile: (modelPath: string) => Promise<void>
        predict: (str: string, nbLabels: number) => Promise<PredictResult[]>
        queryWordVectors(word: string): Promise<number[]>
        queryNearestNeighbors(word: string, nb: number): Promise<string[]>
      }

      export interface ModelConstructor {
        new (): Model
        new (lazy: boolean, keepInMemory: boolean, queryOnly: boolean): Model
      }

      export const Model: ModelConstructor
    }

    export namespace KMeans {
      export interface KMeansOptions {
        maxIterations?: number
        tolerance?: number
        withIterations?: boolean
        distanceFunction?: DistanceFunction
        seed?: number
        initialization?: 'random' | 'kmeans++' | 'mostDistant' | number[][]
      }

      export interface Centroid {
        centroid: number[]
        error: number
        size: number
      }

      // TODO convert this to class we build the source of ml-kmeans
      export interface KmeansResult {
        // constructor(
        //   clusters: number[],
        //   centroids: Centroid[],
        //   converged: boolean,
        //   iterations: number,
        //   distance: DistanceFunction
        // )
        clusters: number[]
        centroids: Centroid[]
        iterations: number
        nearest: (data: DataPoint[]) => number[]
      }

      export type DataPoint = number[]

      export type DistanceFunction = (point0: DataPoint, point1: DataPoint) => number

      export const kmeans: (data: DataPoint[], K: number, options: KMeansOptions) => KmeansResult
    }

    export namespace SVM {
      export interface SVMOptions {
        classifier: 'C_SVC' | 'NU_SVC' | 'ONE_CLASS' | 'EPSILON_SVR' | 'NU_SVR'
        kernel: 'LINEAR' | 'POLY' | 'RBF' | 'SIGMOID'
        seed: number
        c?: number | number[]
        gamma?: number | number[]
        probability?: boolean
        reduce?: boolean
      }

      export interface DataPoint {
        label: string
        coordinates: number[]
      }

      export interface Prediction {
        label: string
        confidence: number
      }

      export interface TrainProgressCallback {
        (progress: number): void
      }

      export class Trainer {
        constructor()
        train(points: DataPoint[], options?: SVMOptions, callback?: TrainProgressCallback): Promise<string>
        isTrained(): boolean
      }

      export class Predictor {
        constructor(model: string)
        predict(coordinates: number[]): Promise<Prediction[]>
        isLoaded(): boolean
        getLabels(): string[]
      }
    }

    export namespace CRF {
      export class Tagger {
        tag(xseq: Array<string[]>): { probability: number; result: string[] }
        open(model_filename: string): boolean
        marginal(xseq: Array<string[]>): { [label: string]: number }[]
      }

      export interface TrainerOptions {
        [key: string]: string
      }

      export interface TrainProgressCallback {
        (iteration: number): void
      }

      interface DataPoint {
        features: Array<string[]>
        labels: string[]
      }

      export class Trainer {
        train(elements: DataPoint[], options: TrainerOptions, progressCallback?: TrainProgressCallback): Promise<string>
      }
    }

    export namespace SentencePiece {
      export interface Processor {
        loadModel: (modelPath: string) => void
        encode: (inputText: string) => string[]
        decode: (pieces: string[]) => string
      }

      export const createProcessor: () => Processor
    }
  }

  export namespace NLU {
    export namespace errors {
      export const isTrainingCanceled: (err: Error) => boolean
      export const isTrainingAlreadyStarted: (err: Error) => boolean
    }

    export const makeEngine: (config: Config, logger: Logger) => Promise<Engine>

    export interface Engine {
      getHealth: () => Health
      getLanguages: () => string[]
      computeModelHash(intents: NLU.IntentDefinition[], entities: NLU.EntityDefinition[], lang: string): string
      loadModel: (model: Model, modelId: string) => Promise<void>
      hasModel: (modelId: string) => boolean
      train: (
        trainSessionId: string,
        intentDefs: NLU.IntentDefinition[],
        entityDefs: NLU.EntityDefinition[],
        languageCode: string,
        options: TrainingOptions
      ) => Promise<Model>
      cancelTraining: (trainSessionId: string) => Promise<void>
      detectLanguage: (text: string, modelByLang: Dic<string>) => Promise<string>
      predict: (text: string, ctx: string[], modelId: string) => Promise<IO.EventUnderstanding>
      spellCheck(sentence: string, modelId: string): Promise<string>
    }

    export interface Config extends LanguageConfig {
      modelCacheSize: number
    }

    export interface LanguageConfig {
      ducklingURL: string
      ducklingEnabled: boolean
      languageSources: LanguageSource[]
    }

    export interface LanguageSource {
      endpoint: string
      authToken?: string
    }

    export interface Logger {
      info: (msg: string) => void
      warning: (msg: string, err?: Error) => void
      error: (msg: string, err?: Error) => void
    }

    export interface TrainingOptions {
      nluSeed: number
      progressCallback: (x: number) => void
      previousModel?: string
    }

    export interface Model {
      hash: string
      languageCode: string
      seed: number
      startedAt: Date
      finishedAt: Date
      data: {
        input: string
        output: string
      }
    }

    export interface Health {
      isEnabled: boolean
      validProvidersCount: number
      validLanguages: string[]
    }

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
      lock?: RedisLock
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
      name: string
      entities: string[]
      color: number
    }

    export interface IntentDefinition {
      name: string
      utterances: {
        [lang: string]: string[]
      }
      filename: string
      slots: SlotDefinition[]
      contexts: string[]
    }

    export interface Intent {
      name: string
      confidence: number
      context: string
      matches?: (intentPattern: string) => boolean
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
      entity: Entity
      confidence: number
      start: number
      end: number
    }

    export type SlotCollection = Dic<Slot>

    export interface Predictions {
      [context: string]: {
        confidence: number
        oos: number
        intents: {
          label: string
          confidence: number
          slots: SlotCollection
          extractor: 'exact-matcher' | 'classifier'
        }[]
      }
    }
  }

  export namespace NDU {
    interface GenericTrigger {
      conditions: DecisionTriggerCondition[]
    }

    export interface WorkflowTrigger extends GenericTrigger {
      type: 'workflow'
      workflowId: string
      nodeId: string
      /** When true, the user must be inside the specified workflow for the trigger to be active */
      activeWorkflow?: boolean
    }

    export interface FaqTrigger extends GenericTrigger {
      type: 'faq'
      faqId: string
      topicName: string
    }

    export interface NodeTrigger extends GenericTrigger {
      type: 'node'
      workflowId: string
      nodeId: string
    }

    export type Trigger = NodeTrigger | FaqTrigger | WorkflowTrigger

    export interface DialogUnderstanding {
      triggers: {
        [triggerId: string]: {
          result: Dic<number>
          trigger: Trigger
        }
      }
      actions: Actions[]
      predictions: { [key: string]: { triggerId: string; confidence: number } }
    }

    export interface Actions {
      action: 'send' | 'startWorkflow' | 'redirect' | 'continue' | 'goToNode'
      data?: SendContent | FlowRedirect
    }

    export interface FlowRedirect {
      flow: string
      node: string
    }

    export type SendContent = Pick<IO.Suggestion, 'confidence' | 'payloads' | 'source' | 'sourceDetails'>
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
    }

    /**
     * A BotpressEvent is how conversational channels interact with Botpress. Events represent all the interactions
     * that make up a conversation. That means the different message types (text, image, buttons, carousels etc) but also
     * the navigational events (chat open, user typing) and contextual events (user returned home, order delivered).
     */
    export type Event = EventDestination & {
      /** A sortable unique identifier for that event (time-based) */
      readonly id: string
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
      intent?: NLU.Intent
      /** Predicted intents needs disambiguation */
      readonly ambiguous?: boolean
      intents?: NLU.Intent[]
      /** The language used for prediction. Will be equal to detected language when its part of supported languages, falls back to default language otherwise */
      readonly language: string
      /** Language detected from users input. */
      readonly detectedLanguage?: string
      readonly spellChecked?: string
      readonly entities: NLU.Entity[]
      readonly slots?: NLU.SlotCollection
      readonly errored: boolean
      readonly includedContexts: string[]
      readonly predictions?: NLU.Predictions
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
      readonly ndu?: NDU.DialogUnderstanding
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
      context: DialogContext
      /** This variable points to the currently active workflow */
      workflow: WorkflowHistory
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
      nduContext?: NduContext
      workflows: {
        [name: string]: WorkflowHistory
      }
      currentWorkflow?: string
      // Prevent warnings when using the code editor with custom properties
      [anyKey: string]: any
    }

    export interface WorkflowHistory {
      eventId: string
      parent?: string
      /** Only one workflow can be active at a time, when a child workflow is active, the parent will be pending */
      status: 'active' | 'pending' | 'completed'
      success?: boolean
    }

    export type StoredEvent = {
      /** This ID is automatically generated when inserted in the DB  */
      readonly id: string
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

    export interface NduContext {
      last_turn_action_name: string
      last_turn_highest_ranking_trigger_id: string
      last_turn_node_id: string
      last_turn_ts: number
      last_topic: string
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

  export interface Notification {
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
    /**
     * Insert or Update the file at the specified location
     * @param rootFolder - Folder relative to the scoped parent
     * @param file - The name of the file
     * @param content - The content of the file
     */
    upsertFile(rootFolder: string, file: string, content: string | Buffer, options?: UpsertOptions): Promise<void>
    readFileAsBuffer(rootFolder: string, file: string): Promise<Buffer>
    readFileAsString(rootFolder: string, file: string): Promise<string>
    readFileAsObject<T>(rootFolder: string, file: string): Promise<T>
    renameFile(rootFolder: string, fromName: string, toName: string): Promise<void>
    deleteFile(rootFolder: string, file: string): Promise<void>
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
    converse?: ConverseConfig
    dialog?: DialogConfig
    logs?: LogsConfig
    defaultLanguage: string
    languages: string[]
    locked: boolean
    pipeline_status: BotPipelineStatus
    oneflow?: boolean
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

  export interface LogsConfig {
    expiration: string
  }

  /**
   * Configuration definition of Dialog Sessions
   */
  export interface DialogConfig {
    /** The interval until a session context expires */
    timeoutInterval: string
    /** The interval until a session expires */
    sessionTimeoutInterval: string
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

  export interface DecisionTriggerCondition {
    id: string
    params?: { [key: string]: any }
  }

  export interface Condition {
    id: string
    /** String displayed in the dropdown */
    label: string
    /** The description holds placeholders for param values so they can be displayed in the view */
    description?: string
    /** The definition of all parameters used by this condition */
    params?: { [paramName: string]: ConditionParam }
    /** In which order the conditions will be displayed in the dropdown menu. 0 is the first item */
    displayOrder?: number
    /** This callback url is called when the condition is deleted or pasted in the flow */
    callback?: string
    /** The editor will use the custom component to provide the requested parameters */
    editor?: {
      module: string
      component: string
    }
    evaluate: (event: IO.IncomingEvent, params: any) => number
  }

  export interface ConditionParam {
    label: string
    /** Each type provides a different kind of editor */
    type: 'string' | 'number' | 'boolean' | 'list' | 'radio' | 'array' | 'content'
    /** Different components can be used to display certain types (eg: boolean/list) */
    subType?: 'switch' | 'radio'
    required?: boolean
    defaultValue?: any
    /** Number of rows (for types which supports it, ex: string, array) */
    rows?: number
    /** When type is list, this variable must be configured */
    list?: ConditionListOptions
  }

  export interface ConditionListOptions {
    /** List of options displayed in the dropdown menu */
    items?: Option[]
    /** Alternatively, set an endpoint where the list will be queried (eg: intents) */
    endpoint?: string
    /** The path to the list of elements (eg: language.available) */
    path?: string
    /** Name of the field which will be used as the value. Default to value */
    valueField?: string
    /** Friendly name displayed in the dropdown menu. Default to label */
    labelField?: string
  }

  export interface Option {
    value: string
    label: string
  }

  export interface Topic {
    name: string
    description: string
  }

  export interface Library {
    elementPath: string
    elementId: string
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
     */
    flow: SkillFlow
    /** An array of possible transitions for the parent node */
    transitions: NodeTransition[]
  }

  /**
   * The partial flow is only used to make some nodes optional. Those left empty will be automatically
   * generated by the skill service.
   */
  export type SkillFlow = Partial<Flow> & Pick<Required<Flow>, 'nodes'>

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

  export type TriggerNode = FlowNode & {
    conditions: DecisionTriggerCondition[]
    activeWorkflow?: boolean
  }

  export type ListenNode = FlowNode & {
    triggers: { conditions: DecisionTriggerCondition[] }[]
  }

  export type SkillFlowNode = Partial<ListenNode> & Pick<Required<ListenNode>, 'name'> & Partial<TriggerNode>

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

  export interface FormData {
    id?: string
    contentType?: string
    [key: string]: FormDataField
  }

  interface FormOption {
    value: any
    label: string
    related?: FormField
  }

  interface FormContextMenu {
    type: string
    label: string
  }

  // TODO use namespace to group form related interfaces
  export interface FormDynamicOptions {
    /** An enpoint to call to get the options */
    endpoint: string
    /** Used with _.get() on the data returned by api to get to the list of items */
    path?: string
    /** Field from DB to map as the value of the options */
    valueField: string
    /** Field from DB to map as the label of the options */
    labelField: string
  }

  export type FormFieldType =
    | 'checkbox'
    | 'group'
    | 'number'
    | 'overridable'
    | 'select'
    | 'multi-select'
    | 'text'
    | 'text_array'
    | 'textarea'
    | 'upload'
    | 'url'
    | 'hidden'
    | 'tag-input'
    | 'variable'

  export interface FormField {
    type: FormFieldType
    key: string
    label?: string
    overrideKey?: string
    placeholder?: string | string[]
    emptyPlaceholder?: string
    options?: FormOption[]
    defaultValue?: FormDataField
    required?: boolean
    variableTypes?: string[]
    customPlaceholder?: boolean
    max?: number
    min?: number
    maxLength?: number
    valueManipulation?: {
      regex: string
      modifier: string
      replaceChar: string
    }
    translated?: boolean
    dynamicOptions?: FormDynamicOptions
    fields?: FormField[]
    moreInfo?: FormMoreInfo
    /** When specified, indicate if array elements match the provided pattern */
    validation?: {
      regex?: RegExp
      list?: any[]
      validator?: (items: any[], newItem: any) => boolean
    }
    group?: {
      /** You have to specify the add button label */
      addLabel?: string
      addLabelTooltip?: string
      /** You can specify a minimum so the delete button won't show if there isn't more than the minimum */
      minimum?: number
      /** You can specify that there's one item of the group by default even if no minimum */
      defaultItem?: boolean
      /** You can add a contextual menu to add extra options */
      contextMenu?: FormContextMenu[]
    }
  }

  export interface FormMoreInfo {
    label: string
    url?: string
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
   * The AxiosBotConfig contains the axios configuration required to call the api of another module.
   * @example: axios.get('/mod/module', axiosBotConfig)
   */
  export interface AxiosBotConfig {
    /** The base url of the bot.
     * @example http://localhost:3000/
     */
    baseURL: string
    headers: {
      Authorization: string
    }
  }

  export interface MigrationResult {
    success: boolean
    message?: string
  }

  export interface ModuleMigration {
    info: {
      description: string
      target?: 'core' | 'bot'
      type: 'database' | 'config' | 'content'
    }
    up: (opts: ModuleMigrationOpts) => Promise<MigrationResult>
    down?: (opts: ModuleMigrationOpts) => Promise<MigrationResult>
  }

  export interface ModuleMigrationOpts {
    bp: typeof import('botpress/sdk')
    metadata: MigrationMetadata
    configProvider: any
    database: any
    inversify: any
  }

  /** These are additional information that Botpress may pass down to migrations (for ex: running bot-specific migration) */
  export interface MigrationMetadata {
    botId?: string
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

  /**
   * All available rollout strategies (how users interact with bots of that workspace)
   * An invite code is permanent, meaning that it will be consumed once and will not be necessary for that user in the future
   *
   * anonymous: Anyone can talk to bots
   * anonymous-invite: Anyone with an invite code can talk to bots
   * authenticated: Authenticated users will be automatically added to workspace as "chat user" (will then be "authorized")
   * authenticated-invite: Authenticated users with an invite code will be added to workspace as "chat user" (will then be "authorized")
   * authorized: Only authenticated users with an existing access to the workspace can talk to bots
   */
  export type RolloutStrategy =
    | 'anonymous'
    | 'anonymous-invite'
    | 'authenticated'
    | 'authenticated-invite'
    | 'authorized'

  export interface WorkspaceRollout {
    rolloutStrategy: RolloutStrategy
    inviteCode?: string
    allowedUsages?: number
  }
  export interface WorkspaceUser {
    email: string
    strategy: string
    role: string
    workspace: string
    workspaceName?: string
  }

  export type WorkspaceUserWithAttributes = {
    attributes: any
  } & WorkspaceUser

  export interface GetWorkspaceUsersOptions {
    attributes: string[] | '*'
    includeSuperAdmins: boolean
  }

  export interface AddWorkspaceUserOptions {
    /** Select an existing custom role for that user. If role, asAdmin and asChatUser are undefined, then it will pick the default role */
    role?: string
    /** When enabled, user is added to the workspace as an admin (role is ignored) */
    asAdmin?: boolean
    /** When enabled, user is added as a chat user (role is ignored)  */
    asChatUser?: boolean
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

  // prettier-ignore
  export type RouterCondition = boolean | ((req: any) => boolean)

  /**
   * Those are possible options you may enable when creating new routers
   */
  export interface RouterOptions {
    /**
     * Check if user is authenticated before granting access
     * @default true
     */
    checkAuthentication: RouterCondition

    /**
     * When checkAuthentication is enabled, set this to true to enforce permissions based on the method.
     * GET/OPTIONS requests requires READ permissions, while all other requires WRITE permissions
     * @default true
     */
    checkMethodPermissions?: RouterCondition

    /**
     * Parse the body as JSON when possible
     * @default true
     */
    enableJsonBodyParser?: RouterCondition

    /**
     * Only parses body which are urlencoded
     * @default true
     */
    enableUrlEncoderBodyParser?: RouterCondition
  }

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

  export interface AxiosOptions {
    /** When true, it will return the local url instead of the external url  */
    localUrl: boolean
  }

  export interface RedisLock {
    /** Free the lock so other nodes can request it */
    unlock(): Promise<void>
    /** Extend the duration of the lock for the node owning it */
    extend(duration: number): Promise<void>
  }

  export interface FileContent {
    name: string
    content: string | Buffer
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
     * Delete any previously created short link
     *
     * @param name - The name of the link to remove
     */
    export function deleteShortLink(name): void

    /**
     * Create a new router for a module. Once created, use them to register new endpoints. Routers created
     * with this method are accessible via the url /mod/{routerName}
     *
     * @example const router = bp.http.createRouterForBot('myModule')
     * @example router.get('/list', ...)
     * @example axios.get('/mod/myModule/list')
     * @param routerName - The name of the router
     * @param options - Additional options to apply to the router
     * @param router - The router
     */
    export function createRouterForBot(routerName: string, options?: RouterOptions): RouterExtension

    /**
     * This method is meant to unregister a router before unloading a module. It is meant to be used in a development environment.
     * It could cause unpredictable behavior in production
     * @param routerName The name of the router (must have been registered with createRouterForBot)
     */
    export function deleteRouterForBot(routerName: string)

    /**
     * Returns the required configuration to make an API call to another module by specifying only the relative path.
     * @param botId - The ID of the bot for which to get the configuration
     * @returns The configuration to use
     */
    export function getAxiosConfigForBot(botId: string, options?: AxiosOptions): Promise<AxiosBotConfig>

    /**
     * Decodes and validates an external authorization token with the public key defined in config file
     * @param token - The encoded JWT token
     * @returns The decoded payload
     */
    export function decodeExternalToken(token: string): Promise<any>

    /**
     * This Express middleware tries to decode the X-BP-ExternalAuth header and adds a credentials header in the request if it's valid.
     */
    export function extractExternalToken(req: Request, res: Response, next: NextFunction): Promise<void>

    export function needPermission(
      operation: string,
      resource: string
    ): (req: Request, res: Response, next: NextFunction) => Promise<void>

    export function hasPermission(req: any, operation: string, resource: string, noAudit?: boolean): Promise<boolean>

    export type RouterExtension = { getPublicPath(): Promise<string> } & Router
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
    export function isIncomingQueueEmpty(event: IO.Event): boolean

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
     */
    export function updateAttributes(channel: string, userId: string, attributes: any): Promise<void>

    /**
     * Overwrite all the attributes of the user with the specified payload
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
     */
    export function deleteSession(sessionId: string): Promise<void>

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

    /**
     * Returns the list of conditions that can be used in an NLU Trigger node
     */
    export function getConditions(): Condition[]
  }

  export namespace config {
    export function getModuleConfig(moduleId: string): Promise<any>

    /**
     * Returns the configuration values for the specified module and bot.
     * @param moduleId
     * @param botId
     * @param ignoreGlobal Enable this when you want only bot-specific configuration to be possible
     */
    export function getModuleConfigForBot(moduleId: string, botId: string, ignoreGlobal?: boolean): Promise<any>

    /**
     * Returns the configuration options of Botpress
     */
    export function getBotpressConfig(): Promise<any>

    /**
     * Merges and saves a bot's config
     * @param botId
     * @param partialConfig
     * @param ignoreLock
     */
    export function mergeBotConfig(botId: string, partialConfig: Partial<BotConfig>, ignoreLock?: boolean): Promise<any>
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
    /**
     * It will extract the bot's folder to an archive (tar.gz).
     * @param botId The ID of the bot to extract
     */
    export function exportBot(botId: string): Promise<Buffer>
    /**
     * Allows to import directly an archive (tar.gz) in a new bot.
     * @param botId The ID of the new bot (or an existing one)
     * @param archive The buffer of the archive file
     * @param workspaceId The workspace where the bot will be imported
     * @param allowOverwrite? If not set, it will throw an error if the folder exists. Otherwise, it will overwrite files already present
     */
    export function importBot(
      botId: string,
      archive: Buffer,
      workspaceId: string,
      allowOverwrite?: boolean
    ): Promise<void>

    export function getBotTemplate(moduleName: string, templateName: string): Promise<FileContent[]>
  }

  export namespace workspaces {
    export function getBotWorkspaceId(botId: string): Promise<string>
    export function addUserToWorkspace(
      email: string,
      strategy: string,
      workspaceId: string,
      options?: AddWorkspaceUserOptions
    ): Promise<void>
    /**
     * Returns the rollout strategy of the requested workspace.
     * If the workspace ID is unknown, it will be determined from the bot ID
     * @param workspaceId
     */
    export function getWorkspaceRollout(workspaceId: string): Promise<WorkspaceRollout>
    /**
     * Consumes an invite code for the specified workspace.
     * @param workspaceId
     * @param inviteCode an invite code to compare to
     * @returns boolean indicating if code was valid & enough usage were left
     */
    export function consumeInviteCode(workspaceId: string, inviteCode?: string): Promise<boolean>

    /**
     * Retreives users in a given workspace
     * @param workspaceId Desired workspace
     * @param options Fetch options object
     * @param options.includeSuperAdmins Whether or not you want to include super admins in the results
     * @param options.attributes List of user attributes you want to include in the object. Use '*' to include all user attributes. Defaults to [].
     * @returns All users in desired workspace with specified attributes.
     */
    export function getWorkspaceUsers(
      workspaceId: string,
      options?: Partial<GetWorkspaceUsersOptions>
    ): Promise<WorkspaceUser[] | WorkspaceUserWithAttributes[]>
  }

  export namespace notifications {
    export function create(botId: string, notification: Notification): Promise<any>
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

    export function deleteContentElements(botId: string, contentElementIds: string[]): Promise<void>

    export function getAllContentTypes(botId?: string): Promise<ContentType[]>
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
     * Updates an existing content element, or creates it if its current ID isn't defined
     *
     * @param botId The ID of the bot
     * @param contentTypeId Only used when creating an element (the ID of the content type (renderer))
     * @param formData The content of your element. May includes translations or not (see language parameter)
     * @param contentElementId If not specified, will be treated as a new element and will be inserted
     * @param language When language is set, only that language will be updated on this element. Otherwise, replaces all content
     */
    export function createOrUpdateContentElement(
      botId: string,
      contentTypeId: string,
      formData: object,
      contentElementId?: string,
      language?: string
    ): Promise<string>

    export function saveFile(botId: string, fileName: string, content: Buffer): Promise<string>
    export function readFile(botId, fileName): Promise<Buffer>
    export function getFilePath(botId: string, fileName: string): string

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
    export function disableHook(hookName: string, hookType: string, moduleName?: string): Promise<boolean>
    export function enableHook(hookName: string, hookType: string, moduleName?: string): Promise<boolean>
  }
}
