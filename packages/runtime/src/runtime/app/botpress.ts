import * as sdk from 'botpress/runtime-sdk'
import { WrapErrorsWith } from 'errors'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import { BotService, BotMonitoringService } from 'runtime/bots'
import { GhostService } from 'runtime/bpfs'
import { CMSService } from 'runtime/cms'
import { RuntimeConfig, ConfigProvider } from 'runtime/config'
import { buildUserKey, converseApiEvents, ConverseService } from 'runtime/converse'
import Database from 'runtime/database'
import { StateManager, DecisionEngine, DialogJanitor, WellKnownFlags, FlowService } from 'runtime/dialog'
import { SessionIdFactory } from 'runtime/dialog/sessions'
import { addStepToEvent, EventCollector, StepScopes, StepStatus, EventEngine, Event } from 'runtime/events'
import { AppLifecycle, AppLifecycleEvents } from 'runtime/lifecycle'
import { LoggerDbPersister, LoggerFilePersister, LoggerProvider, LogsJanitor } from 'runtime/logger'
import { MessagingService } from 'runtime/messaging'
import { MigrationService } from 'runtime/migration'
import { NLUInferenceService } from 'runtime/nlu'
import { QnaService } from 'runtime/qna'
import { Hooks, HookService } from 'runtime/user-code'

import { setDebugScopes } from '../../debug'
import { createForGlobalHooks } from './api'
import { HTTPServer } from './server'
import { TYPES } from './types'

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
    @inject(TYPES.StateManager) private stateManager: StateManager,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.EventCollector) private eventCollector: EventCollector,
    @inject(TYPES.BotMonitoringService) private botMonitor: BotMonitoringService,
    @inject(TYPES.QnaService) private qnaService: QnaService,
    @inject(TYPES.MigrationService) private migrationService: MigrationService,
    @inject(TYPES.MessagingService) private messagingService: MessagingService,
    @inject(TYPES.NLUInferenceService) private nluInferenceService: NLUInferenceService
  ) {}

  async start() {
    const beforeDt = moment()
    await this.initialize()
    const bootTime = moment().diff(beforeDt, 'milliseconds')
    this.logger.info(`Ready in ${bootTime}ms`)
  }

  private async initialize() {
    this.config = await this.configProvider.getRuntimeConfig()
    const bots = await this.botService.getBotsIds()

    await this.startServer()

    setDebugScopes(process.core_env.DEBUG || (process.IS_PRODUCTION ? '' : 'bp:dialog'))

    AppLifecycle.setDone(AppLifecycleEvents.CONFIGURATION_LOADED)

    await this.restoreDebugScope()
    await this.migrationService.initialize()
    await this.initializeServices()

    await this.discoverBots(bots)

    AppLifecycle.setDone(AppLifecycleEvents.BOTPRESS_READY)

    this.api = await createForGlobalHooks()
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

  private async startServer() {
    await this.httpServer.start()
    AppLifecycle.setDone(AppLifecycleEvents.HTTP_SERVER_READY)
  }

  @WrapErrorsWith('Error while discovering bots')
  async discoverBots(botsToMount: string[]): Promise<void> {
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
    await this.nluInferenceService.initialize()
    await this.messagingService.initialize()

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

      this.messagingService.informProcessingDone(event)
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

    this.stateManager.initialize()
    await this.logJanitor.start()
    await this.dialogJanitor.start()
    this.eventCollector.start()
  }
}
