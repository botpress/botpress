import * as sdk from 'botpress/sdk'
import lang from 'common/lang'
import { createForGlobalHooks } from 'core/app/api'
import { BotService, BotMonitoringService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { BotpressConfig, ConfigProvider } from 'core/config'
import { buildUserKey, converseApiEvents } from 'core/converse'
import Database from 'core/database'
import { StateManager, DecisionEngine, DialogEngine, DialogJanitor, WellKnownFlags } from 'core/dialog'
import { SessionIdFactory } from 'core/dialog/sessions'
import { addStepToEvent, EventCollector, StepScopes, StepStatus, EventEngine, Event } from 'core/events'
import { AlertingService, MonitoringService } from 'core/health'
import { LoggerDbPersister, LoggerFilePersister, LoggerProvider, LogsJanitor } from 'core/logger'
import { MessagingService } from 'core/messaging'
import { MigrationService } from 'core/migration'
import { copyDir } from 'core/misc/pkg-fs'
import { ModuleLoader } from 'core/modules'
import { QnaService } from 'core/qna'
import { RealtimeService } from 'core/realtime'
import { AuthService } from 'core/security'
import { StatsService, AnalyticsService } from 'core/telemetry'
import { ActionServersConfigSchema, Hooks, HookService, HintsService } from 'core/user-code'
import { DataRetentionJanitor, DataRetentionService, WorkspaceService } from 'core/users'
import { WrapErrorsWith } from 'errors'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import { nanoid } from 'nanoid'
import { startLocalActionServer, startLocalNLUServer } from 'orchestrator'
import { startLocalMessagingServer } from 'orchestrator/messaging-server'
import path from 'path'
import plur from 'plur'

import { getDebugScopes, setDebugScopes } from '../../debug'
import { HTTPServer } from './server'
import { TYPES } from './types'

export interface StartOptions {
  modules: sdk.ModuleEntryPoint[]
}

@injectable()
export class Botpress {
  botpressPath: string
  configLocation: string
  modulesConfig: any
  config!: BotpressConfig | undefined
  api!: typeof sdk
  _heartbeatTimer?: NodeJS.Timeout

  constructor(
    @inject(TYPES.Statistics) private stats: AnalyticsService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.HintsService) private hintsService: HintsService,
    @inject(TYPES.RealtimeService) private realtimeService: RealtimeService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.DecisionEngine) private decisionEngine: DecisionEngine,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.DialogJanitorRunner) private dialogJanitor: DialogJanitor,
    @inject(TYPES.LogJanitorRunner) private logJanitor: LogsJanitor,
    @inject(TYPES.LoggerDbPersister) private loggerDbPersister: LoggerDbPersister,
    @inject(TYPES.LoggerFilePersister) private loggerFilePersister: LoggerFilePersister,
    @inject(TYPES.StateManager) private stateManager: StateManager,
    @inject(TYPES.DataRetentionJanitor) private dataRetentionJanitor: DataRetentionJanitor,
    @inject(TYPES.DataRetentionService) private dataRetentionService: DataRetentionService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService,
    @inject(TYPES.AlertingService) private alertingService: AlertingService,
    @inject(TYPES.EventCollector) private eventCollector: EventCollector,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.MigrationService) private migrationService: MigrationService,
    @inject(TYPES.StatsService) private statsService: StatsService,
    @inject(TYPES.BotMonitoringService) private botMonitor: BotMonitoringService,
    @inject(TYPES.QnaService) private qnaService: QnaService,
    @inject(TYPES.MessagingService) private messagingService: MessagingService
  ) {
    this.botpressPath = path.join(process.cwd(), 'dist')
    this.configLocation = path.join(this.botpressPath, '/config')
  }

  async start(options: StartOptions) {
    const beforeDt = moment()
    await this.initialize(options)
    const bootTime = moment().diff(beforeDt, 'milliseconds')
    this.logger.info(`Started in ${bootTime}ms`)
  }

  private _killServer(message: string) {
    this.logger.error(message)
    process.exit()
  }

  private async initialize(options: StartOptions) {
    if (!process.IS_PRODUCTION) {
      this.logger.info('Running in DEVELOPMENT MODE')
    }

    this.config = await this.configProvider.getBotpressConfig()

    this.trackStart()
    this.trackHeartbeat()

    setDebugScopes(process.core_env.DEBUG || (process.IS_PRODUCTION ? '' : 'bp:dialog'))

    AppLifecycle.setDone(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.displayRedisChannelPrefix()
    await this.restoreDebugScope()
    await this.checkJwtSecret()
    await this.loadModules(options.modules)
    await this.migrationService.initialize()
    await this.cleanDisabledModules()
    await this.initializeServices()
    await this.checkEditionRequirements()
    await this.deployAssets()
    await this.maybeStartLocalSTAN()
    await this.startRealtime()
    await this.startServer()
    await this.maybeStartLocalMessagingServer()
    await this.discoverBots()
    await this.maybeStartLocalActionServer()

    if (this.config.sendUsageStats) {
      await this.statsService.start()
    }

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

  private async maybeStartLocalActionServer() {
    const { actionServers, experimental } = await this.configProvider.getBotpressConfig()

    if (!actionServers) {
      this.logger.warn('No config ("actionServers") found for Action Servers')
      return
    }

    const { error } = joi.validate(actionServers, ActionServersConfigSchema)
    if (error) {
      this.logger.error(`Invalid actionServers configuration: ${error}`)
      return
    }

    const { enabled, port } = actionServers.local

    if (!enabled) {
      this.logger.info('Local Action Server disabled')
      return
    }

    if (!experimental) {
      this.logger.info('Local Action Server will only run in experimental mode')
      return
    }

    startLocalActionServer({ appSecret: process.APP_SECRET, port })
  }

  private async maybeStartLocalSTAN() {
    if (!process.LOADED_MODULES['nlu']) {
      this.logger.warn(
        'NLU server is disabled. Enable the NLU module and restart Botpress to start the standalone NLU server'
      )
      return
    }

    const config = await this.moduleLoader.configReader.getGlobal('nlu')

    const autoStart = config.nluServer?.autoStart ?? true
    if (!autoStart) {
      if (!config.nluServer?.endpoint) {
        this.logger.warn("NLU server isn't configured properly, set it to auto start or provide an endpoint")
      } else {
        const { endpoint } = config.nluServer
        this.logger.info(`NLU server manually handled at: ${endpoint}`)
        process.NLU_ENDPOINT = endpoint
      }

      return
    }

    const debugScopes = getDebugScopes()
    const nluDebugScopes = Object.entries(debugScopes)
      .filter(([k, v]) => v)
      .map(([k, v]) => k)
      .filter(x => x.startsWith('bp:nlu:'))
      .map(x => x.replace('bp:nlu:', ''))

    const verbose = nluDebugScopes.length ? 4 : 3
    const logFilter = nluDebugScopes.length ? nluDebugScopes : undefined

    startLocalNLUServer({
      languageSources: config.languageSources,
      ducklingURL: config.ducklingURL,
      ducklingEnabled: config.ducklingEnabled,
      legacyElection: config.legacyElection,
      dbURL: process.core_env.BPFS_STORAGE === 'database' ? process.core_env.DATABASE_URL : undefined,
      modelDir: process.cwd(),
      modelCacheSize: config.modelCacheSize,
      logFilter,
      verbose
    })
  }

  private async maybeStartLocalMessagingServer() {
    if (process.core_env.MESSAGING_ENDPOINT) {
      this.logger.info(`Messaging server manually handled at: ${process.core_env.MESSAGING_ENDPOINT}`)
      return
    }

    startLocalMessagingServer({
      CORE_PORT: process.PORT.toString(),
      EXTERNAL_URL: process.EXTERNAL_URL,
      ROOT_PATH: process.ROOT_PATH
    })
  }

  async checkJwtSecret() {
    // @deprecated > 11: .jwtSecret has been renamed for appSecret. botpress > 11 jwtSecret will not be supported
    // @ts-ignore
    let appSecret = this.config.appSecret || this.config.jwtSecret
    if (!appSecret) {
      appSecret = nanoid(40)
      await this.configProvider.mergeBotpressConfig({ appSecret }, true)
      this.logger.debug("JWT Secret isn't defined. Generating a random key...")
    }

    process.APP_SECRET = appSecret
  }

  displayRedisChannelPrefix() {
    if (process.CLUSTER_ENABLED && process.env.REDIS_URL && process.env.BP_REDIS_SCOPE) {
      this.logger.debug(`Redis using scope: ${process.env.BP_REDIS_SCOPE}`)
    }
  }

  async checkEditionRequirements() {
    const { DATABASE_URL } = process.env
    const dbType = DATABASE_URL && DATABASE_URL.toLowerCase().startsWith('postgres') ? 'postgres' : 'sqlite'

    if (!process.IS_PRO_ENABLED && process.CLUSTER_ENABLED) {
      this._killServer(
        'Redis is enabled in your Botpress configuration. To use Botpress in a cluster, please upgrade to Botpress Pro.'
      )
    }

    if (!process.IS_PRO_ENABLED) {
      const workspaces = await this.workspaceService.getWorkspaces()
      if (workspaces.length > 1) {
        this._killServer(
          'You have more than one workspace. To create unlimited workspaces, please upgrade to Botpress Pro.'
        )
      }

      if (workspaces.length) {
        for (const workspace of workspaces) {
          const pipeline = await this.workspaceService.getPipeline(workspace.id)
          if (pipeline && pipeline.length > 1) {
            this._killServer(
              'Your pipeline has more than a single stage. To enable the pipeline feature, please upgrade to Botpress Pro.'
            )
          }
        }
      }
    }

    const bots = await this.botService.getBots()
    bots.forEach(bot => {
      if (!process.IS_PRO_ENABLED && bot.languages && bot.languages.length > 1) {
        this._killServer(
          `A bot has more than a single language (${bot.id}). To enable the multilingual feature, please upgrade to Botpress Pro.`
        )
      }
    })
    if (process.IS_PRO_ENABLED && !process.CLUSTER_ENABLED) {
      this.logger.warn(
        'Botpress can be run on a cluster. If you want to do so, make sure Redis is running and properly configured in your environment variables'
      )
    }
    if (process.IS_PRO_ENABLED && dbType !== 'postgres' && process.CLUSTER_ENABLED) {
      this._killServer(
        'Postgres is required to use Botpress in a cluster. Please migrate your database to Postgres and enable it in your Botpress configuration file.'
      )
    }
    if (process.CLUSTER_ENABLED && !process.env.REDIS_URL) {
      this._killServer('The environment variable REDIS_URL is required when cluster is enabled')
    }

    if (!process.IS_PRO_ENABLED && this.config?.pro.branding) {
      this.logger.warn('Botpress Pro must be enabled to use a custom theme and customize the branding.')
    }
  }

  async deployAssets() {
    try {
      for (const dir of ['./pre-trained', './stop-words']) {
        await copyDir(path.resolve(__dirname, '../../nlu/engine/assets', dir), path.resolve(process.APP_DATA_PATH, dir))
      }

      const assets = path.resolve(process.PROJECT_LOCATION, 'data/assets')
      await copyDir(path.join(__dirname, '../../admin/ui'), `${assets}/admin/ui`)
      await copyDir(path.join(__dirname, '../../ui-lite'), `${assets}/ui-lite`)
    } catch (err) {
      this.logger.attachError(err).error('Error deploying assets')
    }
  }

  @WrapErrorsWith('Error while discovering bots')
  async discoverBots(): Promise<void> {
    await AppLifecycle.waitFor(AppLifecycleEvents.MODULES_READY)
    const botsRef = await this.workspaceService.getBotRefs()
    const botsIds = await this.botService.getBotsIds()
    const unlinked = _.difference(botsIds, botsRef)
    const deleted = _.difference(botsRef, botsIds)

    if (unlinked.length) {
      this.logger.warn(
        `Some unlinked bots exist on your server, to enable them add them to workspaces.json [${unlinked.join(', ')}]`
      )
    }

    if (deleted.length) {
      this.logger.warn(
        `Some bots have been deleted from the disk but are still referenced in your workspaces.json file.
          Please delete them from workspaces.json to get rid of this warning. [${deleted.join(', ')}]`
      )
    }

    const bots = await this.botService.getBots()

    for (const workspace of await this.workspaceService.getWorkspaces()) {
      const pipeline = await this.workspaceService.getPipeline(workspace.id)
      if (pipeline && pipeline.length > 4) {
        this.logger.warn(
          `It seems like you have more than 4 stages in your pipeline, consider to join stages together (workspace: ${workspace.id})`
        )
      }
    }

    const disabledBots = [...bots.values()].filter(b => b.disabled).map(b => b.id)
    const botsToMount = _.without(botsRef, ...disabledBots, ...deleted)

    disabledBots.forEach(botId => BotService.setBotStatus(botId, 'disabled'))

    this.logger.info(
      `Discovered ${botsToMount.length} bot${botsToMount.length === 1 ? '' : 's'}${
        botsToMount.length ? `, mounting ${botsToMount.length === 1 ? 'it' : 'them'}...` : ''
      }`
    )

    const maxConcurrentMount = parseInt(process.env.MAX_CONCURRENT_MOUNT || '5')
    await Promise.map(botsToMount, botId => this.botService.mountBot(botId), { concurrency: maxConcurrentMount })
  }

  private async initializeServices() {
    await this.loggerDbPersister.initialize(this.database, await this.loggerProvider('LogDbPersister'))
    this.loggerDbPersister.start()

    await this.loggerFilePersister.initialize(this.config!, await this.loggerProvider('LogFilePersister'))

    this.configProvider.onBotpressConfigChanged = async (initialHash: string, newHash: string) => {
      this.realtimeService.sendToSocket({ eventName: 'config.updated', payload: { initialHash, newHash } })
    }

    await this.authService.initialize()
    await this.workspaceService.initialize()
    await this.cmsService.initialize()
    await this.eventCollector.initialize(this.database)
    this.qnaService.initialize()

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

      if (event.ndu && event.type === 'workflow_ended') {
        const hasWorkflowEndedTrigger = Object.keys(event.ndu.triggers).find(
          x => event.ndu?.triggers[x].result['workflow_ended'] === 1
        )

        if (!hasWorkflowEndedTrigger) {
          event.setFlag(WellKnownFlags.SKIP_DIALOG_ENGINE, true)
        }
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
      if (!event.ndu) {
        this.eventCollector.storeEvent(event)
        return this.hookService.executeHook(new Hooks.AfterEventProcessed(this.api, event))
      }

      const { workflows } = event.state.session

      const activeWorkflow = Object.keys(workflows).find(x => workflows[x].status === 'active')
      const completedWorkflows = Object.keys(workflows).filter(x => workflows[x].status === 'completed')

      this.eventCollector.storeEvent(event, activeWorkflow ? workflows[activeWorkflow] : undefined)
      await this.hookService.executeHook(new Hooks.AfterEventProcessed(this.api, event))

      completedWorkflows.forEach(async workflow => {
        const wf = workflows[workflow]
        const metric = wf.success ? 'bp_core_workflow_completed' : 'bp_core_workflow_failed'
        BOTPRESS_CORE_EVENT(metric, { botId: event.botId, channel: event.channel, wfName: workflow })

        delete event.state.session.workflows[workflow]

        if (!activeWorkflow && !wf.parent) {
          await this.eventEngine.sendEvent(
            Event({
              ..._.pick(event, ['botId', 'channel', 'target', 'threadId']),
              direction: 'incoming',
              type: 'workflow_ended',
              payload: { ...wf, workflow }
            })
          )
        }
      })
    }

    this.botMonitor.onBotError = async (botId: string, events: sdk.LoggerEntry[]) => {
      await this.hookService.executeHook(new Hooks.OnBotError(this.api, botId, events))
    }

    await this.dataRetentionService.initialize()

    this.stateManager.initialize()
    await this.logJanitor.start()
    await this.dialogJanitor.start()
    await this.monitoringService.start()
    this.alertingService.start()
    this.eventCollector.start()
    await this.botMonitor.start()

    if (this.config!.dataRetention) {
      await this.dataRetentionJanitor.start()
    }

    lang.init(await this.moduleLoader.getTranslations())

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.hintsService.refreshAll()

    AppLifecycle.setDone(AppLifecycleEvents.SERVICES_READY)
  }

  private async loadModules(modules: sdk.ModuleEntryPoint[]): Promise<void> {
    const loadedModules = await this.moduleLoader.loadModules(modules)
    this.logger.info(`Loaded ${loadedModules.length} ${plur('module', loadedModules.length)}`)
  }

  private async cleanDisabledModules() {
    try {
      const config = await this.configProvider.getBotpressConfig()
      const disabledModules = config.modules.filter(m => !m.enabled).map(m => path.basename(m.location))

      await this.moduleLoader.disableModuleResources(disabledModules)
    } catch (err) {
      this.logger.attachError(err).error('Error while disabling module resources')
    }
  }

  private async startServer() {
    await this.httpServer.start()
    AppLifecycle.setDone(AppLifecycleEvents.HTTP_SERVER_READY)
  }

  private async startRealtime() {
    await this.realtimeService.installOnHttpServer(this.httpServer.httpServer)
  }

  private trackStart() {
    this.stats.track(
      'server',
      'start',
      `version: ${process.BOTPRESS_VERSION}, pro: ${process.IS_PRO_ENABLED}, licensed: ${process.IS_LICENSED}`
    )
  }

  private trackHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer)
    }

    this._heartbeatTimer = setInterval(async () => {
      let nbBots = 'N/A'
      let nbCollabs = 'N/A'
      try {
        nbBots = (await this.botService.getBotsIds()).length.toString()
        nbCollabs = (await this.workspaceService.listUsers()).length.toString()
      } finally {
        this.stats.track(
          'server',
          'heartbeat',
          `version: ${process.BOTPRESS_VERSION}, pro: ${process.IS_PRO_ENABLED}, licensed: ${process.IS_LICENSED}, bots: ${nbBots}, collaborators: ${nbCollabs}`
        )
      }
    }, ms('2m'))
  }
}
