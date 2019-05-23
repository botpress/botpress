import * as sdk from 'botpress/sdk'
import { copyDir } from 'core/misc/pkg-fs'
import { WrapErrorsWith } from 'errors'
import fse from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _, { Partial } from 'lodash'
import moment from 'moment'
import nanoid from 'nanoid'
import path from 'path'
import plur from 'plur'

import { setDebugScopes } from '../debug'

import { createForGlobalHooks } from './api'
import { BotConfig } from './config/bot.config'
import { BotpressConfig } from './config/botpress.config'
import { ConfigProvider } from './config/config-loader'
import Database, { DatabaseType } from './database'
import { LoggerDbPersister, LoggerFilePersister, LoggerProvider } from './logger'
import { ModuleLoader } from './module-loader'
import HTTPServer from './server'
import { GhostService } from './services'
import { AlertingService } from './services/alerting-service'
import { BotService } from './services/bot-service'
import { CMSService } from './services/cms'
import { converseApiEvents } from './services/converse'
import { DecisionEngine } from './services/dialog/decision-engine'
import { DialogEngine } from './services/dialog/dialog-engine'
import { ProcessingError } from './services/dialog/errors'
import { DialogJanitor } from './services/dialog/janitor'
import { SessionIdFactory } from './services/dialog/session/id-factory'
import { Hooks, HookService } from './services/hook/hook-service'
import { LogsJanitor } from './services/logs/janitor'
import { EventEngine } from './services/middleware/event-engine'
import { StateManager } from './services/middleware/state-manager'
import { MonitoringService } from './services/monitoring'
import { NotificationsService } from './services/notification/service'
import RealtimeService from './services/realtime'
import { DataRetentionJanitor } from './services/retention/janitor'
import { DataRetentionService } from './services/retention/service'
import { WorkspaceService } from './services/workspace-service'
import { Statistics } from './stats'
import { TYPES } from './types'

export type StartOptions = {
  modules: sdk.ModuleEntryPoint[]
}

@injectable()
export class Botpress {
  botpressPath: string
  configLocation: string
  modulesConfig: any
  version: string
  config!: BotpressConfig | undefined
  api!: typeof sdk

  constructor(
    @inject(TYPES.Statistics) private stats: Statistics,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.HookService) private hookService: HookService,
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
    @inject(TYPES.NotificationsService) private notificationService: NotificationsService,
    @inject(TYPES.StateManager) private stateManager: StateManager,
    @inject(TYPES.DataRetentionJanitor) private dataRetentionJanitor: DataRetentionJanitor,
    @inject(TYPES.DataRetentionService) private dataRetentionService: DataRetentionService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService,
    @inject(TYPES.AlertingService) private alertingService: AlertingService
  ) {
    this.version = '12.0.1'
    this.botpressPath = path.join(process.cwd(), 'dist')
    this.configLocation = path.join(this.botpressPath, '/config')
  }

  async start(options: StartOptions) {
    const beforeDt = moment()
    await this.initialize(options)
    const bootTime = moment().diff(beforeDt, 'milliseconds')
    this.logger.info(`Started in ${bootTime}ms`)
  }

  private async initialize(options: StartOptions) {
    this.trackStart()

    setDebugScopes(process.core_env.DEBUG || (process.IS_PRODUCTION ? '' : 'bp:dialog'))

    this.config = await this.loadConfiguration()
    await this.createDatabase()
    await this.initializeGhost()

    // Invalidating the configuration to force it to load it from the ghost if enabled
    this.config = await this.loadConfiguration(true)

    await AppLifecycle.setDone(AppLifecycleEvents.CONFIGURATION_LOADED)

    await this.checkJwtSecret()
    await this.loadModules(options.modules)
    await this.cleanDisabledModules()
    await this.initializeServices()
    await this.checkEditionRequirements()
    await this.deployAssets()
    await this.startRealtime()
    await this.startServer()
    await this.discoverBots()

    this.api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterServerStart(this.api))
  }

  async checkJwtSecret() {
    // @deprecated > 11: .jwtSecret has been renamed for appSecret. botpress > 11 jwtSecret will not be supported
    // @ts-ignore
    let appSecret = this.config.appSecret || this.config.jwtSecret
    if (!appSecret) {
      appSecret = nanoid(40)
      await this.configProvider.mergeBotpressConfig({ appSecret })
      this.logger.debug(`JWT Secret isn't defined. Generating a random key...`)
    }

    process.APP_SECRET = appSecret
  }

  async checkEditionRequirements() {
    const databaseType = this.getDatabaseType()

    if (!process.IS_PRO_ENABLED && process.CLUSTER_ENABLED) {
      this.logger.warn(
        'Redis is enabled in your Botpress configuration. To use Botpress in a cluster, please upgrade to Botpress Pro.'
      )
    }
    const nStage = (await this.workspaceService.getPipeline()).length
    if (!process.IS_PRO_ENABLED && nStage > 1) {
      throw new Error(
        'Your pipeline has more than a single stage. To enable the pipeline feature, please upgrade to Botpress Pro.'
      )
    }
    const bots = await this.botService.getBots()
    bots.forEach(bot => {
      if (!process.IS_PRO_ENABLED && bot.languages && bot.languages.length > 1) {
        throw new Error(
          'A bot has more than a single language. To enable the multilangual feature, please upgrade to Botpress Pro.'
        )
      }
    })
    if (process.IS_PRO_ENABLED && !process.CLUSTER_ENABLED) {
      this.logger.warn(
        'Botpress can be run on a cluster. If you want to do so, make sure Redis is running and properly configured in your environment variables'
      )
    }
    if (process.IS_PRO_ENABLED && databaseType !== 'postgres' && process.CLUSTER_ENABLED) {
      throw new Error(
        'Postgres is required to use Botpress in a cluster. Please migrate your database to Postgres and enable it in your Botpress configuration file.'
      )
    }
    if (process.CLUSTER_ENABLED && !process.env.REDIS_URL) {
      throw new Error('The environment variable REDIS_URL is required when cluster is enabled')
    }
  }

  async deployAssets() {
    try {
      const assets = path.resolve(process.PROJECT_LOCATION, 'assets')
      await copyDir(path.join(__dirname, '../ui-admin'), `${assets}/ui-admin`)

      // Avoids overwriting the folder when developping locally on the studio
      if (fse.pathExistsSync(`${assets}/ui-studio/public`)) {
        const studioPath = await fse.lstatSync(`${assets}/ui-studio/public`)
        if (studioPath.isSymbolicLink()) {
          return
        }
      }

      await copyDir(path.join(__dirname, '../ui-studio'), `${assets}/ui-studio`)
    } catch (err) {
      this.logger.attachError(err).error('Error deploying assets')
    }
  }

  @WrapErrorsWith('Error while discovering bots')
  async discoverBots(): Promise<void> {
    const botsRef = await this.workspaceService.getBotRefs()

    for (const botId of botsRef) {
      await this.ghostService.forBot(botId).sync()
    }

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

    let bots = await this.botService.getBots()
    const pipeline = await this.workspaceService.getPipeline()
    if (pipeline.length > 4) {
      this.logger.warn('It seems like you have more than 4 stages in your pipeline, consider to join stages together.')
    }

    // @deprecated > 11: bot will always include default pipeline stage & must have a default language
    const botConfigChanged = await this._ensureBotConfigCorrect(bots, pipeline[0])
    if (botConfigChanged) {
      bots = await this.botService.getBots()
    }

    const disabledBots = [...bots.values()]
      .filter(b => {
        const isStage0 = b.pipeline_status.current_stage.id === pipeline[0].id
        const stageExist = pipeline.findIndex(s => s.id === b.pipeline_status.current_stage.id) !== -1
        return b.disabled || ((!process.IS_PRO_ENABLED && !isStage0) || !stageExist)
      })
      .map(b => b.id)
    const botsToMount = _.without(botsRef, ...disabledBots, ...deleted)

    await Promise.map(botsToMount, botId => this.botService.mountBot(botId))
  }

  @WrapErrorsWith('Error initializing Ghost Service')
  async initializeGhost(): Promise<void> {
    this.ghostService.initialize(process.IS_PRODUCTION)
    await this.ghostService.global().sync()
  }

  // @deprecated > 11: bot will always include default pipeline stage
  private async _ensureBotConfigCorrect(bots: Map<string, BotConfig>, stage: sdk.Stage): Promise<Boolean> {
    let hasChanges = false
    await Promise.mapSeries(bots.values(), async bot => {
      const updatedConfig: any = {}

      if (!bot.defaultLanguage) {
        this.logger.warn(
          `Bot "${
            bot.id
          }" doesn't have a default language, which is now required, go to your admin console to fix this issue.`
        )
        updatedConfig.disabled = true
      }

      if (!bot.pipeline_status) {
        updatedConfig.locked = false
        updatedConfig.pipeline_status = {
          current_stage: {
            id: stage.id,
            promoted_by: 'system',
            promoted_on: new Date()
          }
        }
      }

      if (Object.getOwnPropertyNames(updatedConfig).length) {
        hasChanges = true
        await this.configProvider.mergeBotConfig(bot.id, updatedConfig)
      }
    })

    return hasChanges
  }

  private async initializeServices() {
    await this.loggerDbPersister.initialize(this.database, await this.loggerProvider('LogDbPersister'))
    this.loggerDbPersister.start()

    await this.loggerFilePersister.initialize(this.config!, await this.loggerProvider('LogFilePersister'))

    await this.workspaceService.initialize()
    await this.cmsService.initialize()

    this.eventEngine.onBeforeIncomingMiddleware = async (event: sdk.IO.IncomingEvent) => {
      await this.stateManager.restore(event)
      await this.hookService.executeHook(new Hooks.BeforeIncomingMiddleware(this.api, event))
    }

    this.eventEngine.onAfterIncomingMiddleware = async (event: sdk.IO.IncomingEvent) => {
      if (event.isPause) {
        return
      }

      await this.hookService.executeHook(new Hooks.AfterIncomingMiddleware(this.api, event))
      const sessionId = SessionIdFactory.createIdFromEvent(event)
      await this.decisionEngine.processEvent(sessionId, event)
      await converseApiEvents.emitAsync(`done.${event.target}`, event)
    }

    this.eventEngine.onBeforeOutgoingMiddleware = async (event: sdk.IO.IncomingEvent) => {
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
      await this.hookService.executeHook(new Hooks.AfterEventProcessed(this.api, event))
    }

    await this.dataRetentionService.initialize()

    const dialogEngineLogger = await this.loggerProvider('DialogEngine')
    this.dialogEngine.onProcessingError = (err, hideStack?) => {
      const message = this.formatProcessingError(err)
      if (!hideStack) {
        dialogEngineLogger
          .forBot(err.botId)
          .attachError(err)
          .warn(message)
      } else {
        dialogEngineLogger.forBot(err.botId).warn(message)
      }
    }

    this.notificationService.onNotification = notification => {
      const payload: sdk.RealTimePayload = {
        eventName: 'notifications.new',
        payload: notification
      }
      this.realtimeService.sendToSocket(payload)
    }

    await this.logJanitor.start()
    await this.dialogJanitor.start()
    await this.monitoringService.start()
    await this.alertingService.start()

    if (this.config!.dataRetention) {
      await this.dataRetentionJanitor.start()
    }

    await AppLifecycle.setDone(AppLifecycleEvents.SERVICES_READY)
  }

  private async loadConfiguration(forceInvalidate?): Promise<BotpressConfig> {
    if (forceInvalidate) {
      await this.configProvider.invalidateBotpressConfig()
    }
    return this.configProvider.getBotpressConfig()
  }

  private getDatabaseType(): DatabaseType {
    const databaseUrl = process.env.DATABASE_URL
    const databaseType = databaseUrl && databaseUrl.toLowerCase().startsWith('postgres') ? 'postgres' : 'sqlite'

    return databaseType
  }

  @WrapErrorsWith(`Error initializing Database. Please check your configuration`)
  private async createDatabase(): Promise<void> {
    const databaseType = this.getDatabaseType()
    await this.database.initialize(<DatabaseType>databaseType.toLowerCase(), process.env.DATABASE_URL)
  }

  private async loadModules(modules: sdk.ModuleEntryPoint[]): Promise<void> {
    const loadedModules = await this.moduleLoader.loadModules(modules)
    this.logger.info(`Loaded ${loadedModules.length} ${plur('module', loadedModules.length)}`)
  }

  private async cleanDisabledModules() {
    const config = await this.configProvider.getBotpressConfig()
    const disabledModules = config.modules.filter(m => !m.enabled).map(m => path.basename(m.location))

    await this.moduleLoader.disableModuleResources(disabledModules)
  }

  private async startServer() {
    await this.httpServer.start()
    AppLifecycle.setDone(AppLifecycleEvents.HTTP_SERVER_READY)
  }

  private startRealtime() {
    this.realtimeService.installOnHttpServer(this.httpServer.httpServer)
  }

  private formatProcessingError(err: ProcessingError) {
    return `Error processing "${err.instruction}"
Err: ${err.message}
Flow: ${err.flowName}
Node: ${err.nodeName}`
  }

  private trackStart() {
    this.stats.track(
      'server',
      'start',
      `version: ${process.BOTPRESS_VERSION}, pro: ${process.IS_PRO_ENABLED}, licensed: ${process.IS_LICENSED}`
    )
  }
}
