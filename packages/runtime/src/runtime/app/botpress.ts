import * as sdk from 'botpress/runtime-sdk'

import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { RuntimeSetup, BotpressRuntime } from '../..'
import { setDebugScopes } from '../../debug'
import { WrapErrorsWith } from '../../errors'
import { BotService, BotMonitoringService } from '../bots'
import { GhostService } from '../bpfs'
import { CMSService } from '../cms'
import { RuntimeConfig, ConfigProvider } from '../config'
import { buildUserKey, converseApiEvents, ConverseService } from '../converse'
import Database from '../database'
import { StateManager, DecisionEngine, DialogJanitor, FlowService, DialogEngine } from '../dialog'
import { SessionIdFactory } from '../dialog/sessions'
import { addStepToEvent, EventCollector, StepScopes, StepStatus, EventEngine } from '../events'
import { AppLifecycle, AppLifecycleEvents } from '../lifecycle'
import { LoggerDbPersister, LoggerFilePersister, LoggerProvider, LogsJanitor, PersistedConsoleLogger } from '../logger'
import { MessagingService } from '../messaging'
import { MigrationService } from '../migration'
import { NLUInferenceService } from '../nlu'
import { QnaService } from '../qna'
import { StatsService } from '../telemetry'
import { Hooks, HookService, ActionService } from '../user-code'
import { DataRetentionJanitor } from '../users'

import { createForAction, createForGlobalHooks } from './api'
import { HTTPServer } from './server'
import { TYPES } from './types'

const DEBOUNCE_DELAY = ms('5s')

@injectable()
export class Botpress {
  config!: RuntimeConfig | undefined
  api!: typeof sdk

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.ConverseService) private converseService: ConverseService,
    @inject(TYPES.DecisionEngine) private decisionEngine: DecisionEngine,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.DialogJanitorRunner) private dialogJanitor: DialogJanitor,
    @inject(TYPES.LogJanitorRunner) private logJanitor: LogsJanitor,
    @inject(TYPES.LoggerDbPersister) private loggerDbPersister: LoggerDbPersister,
    @inject(TYPES.LoggerFilePersister) private loggerFilePersister: LoggerFilePersister,
    @inject(TYPES.DataRetentionJanitor) private dataRetentionJanitor: DataRetentionJanitor,
    @inject(TYPES.StateManager) private stateManager: StateManager,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.EventCollector) private eventCollector: EventCollector,
    @inject(TYPES.BotMonitoringService) private botMonitor: BotMonitoringService,
    @inject(TYPES.QnaService) private qnaService: QnaService,
    @inject(TYPES.MigrationService) private migrationService: MigrationService,
    @inject(TYPES.StatsService) private statsService: StatsService,
    @inject(TYPES.MessagingService) private messagingService: MessagingService,
    @inject(TYPES.NLUInferenceService) private nluInferenceService: NLUInferenceService,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine
  ) {}

  async start(config?: RuntimeSetup): Promise<BotpressRuntime> {
    const beforeDt = moment()
    await this.initialize(config)
    const bootTime = moment().diff(beforeDt, 'milliseconds')
    this.logger.info(`Ready in ${bootTime}ms`)

    return {
      initExternalServices: async () => {
        if (config?.httpServer) {
          this.httpServer.setupRoutes(config?.httpServer)
        }

        await this.nluInferenceService.initialize()
        await this.messagingService.initialize()
      },
      bots: {
        mount: this.botService.mountBot.bind(this.botService),
        unmount: this.botService.unmountBot.bind(this.botService)
      },
      sendConverseMessage: this.converseService.sendMessage.bind(this.converseService),
      events: this.api.events,
      dialog: this.api.dialog,
      users: this.api.users
    }
  }

  private async initStandalone() {
    setDebugScopes(process.runtime_env.DEBUG || (process.IS_PRODUCTION ? '' : 'bp:dialog'))

    this.config = await this.configProvider.getRuntimeConfig()
    const bots = await this.botService.getBotsIds()

    await this.httpServer.start()

    AppLifecycle.setDone(AppLifecycleEvents.CONFIGURATION_LOADED)

    await this.restoreDebugScope()
    await this.migrationService.initialize()
    await this.initializeServices()
    await this.nluInferenceService.initialize()
    await this.messagingService.initialize()

    await this.discoverBots(bots)

    this.api = await createForGlobalHooks()
  }

  private async initEmbedded(options: RuntimeSetup) {
    if (options.config) {
      this.configProvider.setRuntimeConfig(options.config)
      this.config = options.config
    } else {
      this.config = await this.configProvider.getRuntimeConfig()
    }

    AppLifecycle.setDone(AppLifecycleEvents.CONFIGURATION_LOADED)

    if (options.logger?.emitter) {
      PersistedConsoleLogger.LogStreamEmitter = options.logger.emitter
    }

    this.api = await createForGlobalHooks(options.apiExtension)
    await createForAction(options.apiExtension)

    await this.migrationService.initialize()
    await this.initializeServices()
  }

  private async initialize(options?: RuntimeSetup) {
    if (options) {
      await this.initEmbedded(options)
    } else {
      await this.initStandalone()
    }

    if (this.config?.sendUsageStats) {
      await this.statsService.start()
    }

    AppLifecycle.setDone(AppLifecycleEvents.BOTPRESS_READY)

    await this.hookService.executeHook(new Hooks.AfterServerStart(this.api))
  }

  async restoreDebugScope() {
    if (await this.ghostService.global().fileExists('/', 'debug.json')) {
      try {
        const { scopes } = await this.ghostService.global().readFileAsObject('/', 'debug.json')
        setDebugScopes(scopes.join(','))
      } catch (err) {
        this.logger.attachError(err).error("Couldn't load debug scopes. Check the syntax of debug.json")
      }
    }
  }

  @WrapErrorsWith('Error while discovering bots')
  async discoverBots(botsToMount: string[]): Promise<void> {
    this.logger.info(`Mounting ${botsToMount.length} bots...`)

    const maxConcurrentMount = parseInt(process.env.MAX_CONCURRENT_MOUNT || '5')
    await Promise.map(botsToMount, botId => this.botService.mountBot(botId), { concurrency: maxConcurrentMount })
  }

  private async initializeServices() {
    await this.loggerDbPersister.initialize(this.database, await this.loggerProvider('LogDbPersister'))
    this.loggerDbPersister.start()

    await this.loggerFilePersister.initialize(this.config!, await this.loggerProvider('LogFilePersister'))

    await this.cmsService.initialize()
    await this.eventCollector.initialize(this.database)
    this.qnaService.initialize()

    await this.registerHooks()

    if (this.config!.dataRetention) {
      await this.dataRetentionJanitor.start()
    }

    this.stateManager.initialize()
    await this.logJanitor.start()
    await this.dialogJanitor.start()
    this.eventCollector.start()

    this.botService.onBotImported = this.wipeCache.bind(this)
  }

  private async wipeCache(botId: string) {
    await this.ghostService.forBot(botId).clearCache()

    await this.cmsService.refreshElements(botId)
    await this.flowService.forBot(botId).reloadFlows()

    this.hookService.clearRequireCache()
    this.actionService.forBot(botId).clearRequireCache()
  }

  async registerHooks() {
    this.eventEngine.onBeforeIncomingMiddleware = async (event: sdk.IO.IncomingEvent) => {
      await this.stateManager.restore(event)
      addStepToEvent(event, StepScopes.StateLoaded)
      await this.hookService.executeHook(new Hooks.BeforeIncomingMiddleware(this.api, event))
    }

    this.eventEngine.onAfterIncomingMiddleware = async (event: sdk.IO.IncomingEvent) => {
      if (event.isPause) {
        this.eventCollector.storeEvent(event)
        return
      }

      await this.hookService.executeHook(new Hooks.AfterIncomingMiddleware(this.api, event))
      const sessionId = SessionIdFactory.createIdFromEvent(event)

      if (event.debugger) {
        addStepToEvent(event, StepScopes.Dialog, StepStatus.Started)
        this.eventCollector.storeEvent(event)
      }

      await this.decisionEngine.processEvent(sessionId, event)

      if (event.debugger) {
        addStepToEvent(event, StepScopes.EndProcessing)
        this.eventCollector.storeEvent(event)
      }

      this.messagingService.collector.informProcessingDone(event)
      await converseApiEvents.emitAsync(`done.${buildUserKey(event.botId, event.target)}`, event)
    }

    this.eventEngine.onBeforeOutgoingMiddleware = async (event: sdk.IO.OutgoingEvent) => {
      this.eventCollector.storeEvent(event)
      await this.hookService.executeHook(new Hooks.BeforeOutgoingMiddleware(this.api, event))
    }

    this.decisionEngine.onBeforeSuggestionsElection = async (
      sessionId: string,
      event: sdk.IO.IncomingEvent,
      suggestions: sdk.IO.Suggestion[]
    ) => {
      await this.hookService.executeHook(new Hooks.BeforeSuggestionsElection(this.api, sessionId, event, suggestions))
    }

    this.decisionEngine.onAfterEventProcessed = async (event: sdk.IO.IncomingEvent) => {
      this.eventCollector.storeEvent(event)
      return this.hookService.executeHook(new Hooks.AfterEventProcessed(this.api, event))
    }

    this.botMonitor.onBotError = async (botId: string, events: sdk.LoggerEntry[]) => {
      await this.hookService.executeHook(new Hooks.OnBotError(this.api, botId, events))
    }
  }
}
