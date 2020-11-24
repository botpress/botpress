import * as sdk from 'botpress/sdk'
import { WellKnownFlags } from 'core/sdk/enums'
import { NextFunction, Request, Response } from 'express'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import MLToolkit from 'ml/toolkit'
import Engine from 'nlu-core/engine'
import { isTrainingAlreadyStarted, isTrainingCanceled } from 'nlu-core/errors'

import { container } from './app.inversify'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { LoggerProvider } from './logger'
import { getMessageSignature } from './misc/security'
import { renderRecursive } from './misc/templating'
import { ModuleLoader } from './module-loader'
import { EventRepository, SessionRepository, UserRepository } from './repositories'
import { Event, RealTimePayload } from './sdk/impl'
import HTTPServer from './server'
import { GhostService } from './services'
import { BotService } from './services/bot-service'
import { CMSService } from './services/cms'
import { DialogEngine } from './services/dialog/dialog-engine'
import { SessionIdFactory } from './services/dialog/session/id-factory'
import { HookService } from './services/hook/hook-service'
import { JobService } from './services/job-service'
import { KeyValueStore } from './services/kvs'
import MediaService from './services/media'
import { EventEngine } from './services/middleware/event-engine'
import { StateManager } from './services/middleware/state-manager'
import { NotificationsService } from './services/notification/service'
import RealtimeService from './services/realtime'
import { WorkspaceService } from './services/workspace-service'
import { TYPES } from './types'

const http = (httpServer: HTTPServer) => (identity: string): typeof sdk.http => {
  return {
    createShortLink(name: string, destination: string, params?: any): void {
      httpServer.createShortLink(name, destination, params)
    },
    deleteShortLink(name: string): void {
      httpServer.deleteShortLink(name)
    },
    createRouterForBot(routerName: string, options?: sdk.RouterOptions): any & sdk.http.RouterExtension {
      const defaultRouterOptions = { checkAuthentication: true, enableJsonBodyParser: true }
      return httpServer.createRouterForBot(routerName, identity, options || defaultRouterOptions)
    },
    deleteRouterForBot: httpServer.deleteRouterForBot.bind(httpServer),
    getAxiosConfigForBot: httpServer.getAxiosConfigForBot.bind(httpServer),
    extractExternalToken: httpServer.extractExternalToken.bind(httpServer),
    decodeExternalToken: httpServer.decodeExternalToken.bind(httpServer),
    needPermission: httpServer.needPermission.bind(httpServer),
    hasPermission: httpServer.hasPermission.bind(httpServer)
  }
}

const event = (eventEngine: EventEngine, eventRepo: EventRepository): typeof sdk.events => {
  return {
    registerMiddleware(middleware: sdk.IO.MiddlewareDefinition) {
      eventEngine.register(middleware)
    },
    removeMiddleware: eventEngine.removeMiddleware.bind(eventEngine),
    sendEvent: eventEngine.sendEvent.bind(eventEngine),
    replyToEvent: eventEngine.replyToEvent.bind(eventEngine),
    isIncomingQueueEmpty: eventEngine.isIncomingQueueEmpty.bind(eventEngine),
    findEvents: eventRepo.findEvents.bind(eventRepo),
    updateEvent: eventRepo.updateEvent.bind(eventRepo),
    saveUserFeedback: eventRepo.saveUserFeedback.bind(eventRepo)
  }
}

const dialog = (
  dialogEngine: DialogEngine,
  stateManager: StateManager,
  moduleLoader: ModuleLoader
): typeof sdk.dialog => {
  return {
    createId: SessionIdFactory.createIdFromEvent.bind(SessionIdFactory),
    processEvent: dialogEngine.processEvent.bind(dialogEngine),
    deleteSession: stateManager.deleteDialogSession.bind(stateManager),
    jumpTo: dialogEngine.jumpTo.bind(dialogEngine),
    getConditions: moduleLoader.getDialogConditions.bind(moduleLoader)
  }
}

const config = (moduleLoader: ModuleLoader, configProvider: ConfigProvider): typeof sdk.config => {
  return {
    getModuleConfig: moduleLoader.configReader.getGlobal.bind(moduleLoader.configReader),
    getModuleConfigForBot: moduleLoader.configReader.getForBot.bind(moduleLoader.configReader),
    getBotpressConfig: configProvider.getBotpressConfig.bind(configProvider),
    mergeBotConfig: configProvider.mergeBotConfig.bind(configProvider)
  }
}

const bots = (botService: BotService): typeof sdk.bots => {
  return {
    getAllBots(): Promise<Map<string, sdk.BotConfig>> {
      return botService.getBots()
    },
    getBotById(botId: string): Promise<sdk.BotConfig | undefined> {
      return botService.findBotById(botId)
    },
    exportBot(botId: string): Promise<Buffer> {
      return botService.exportBot(botId)
    },
    importBot: botService.importBot.bind(botService),
    getBotTemplate: botService.getBotTemplate.bind(botService)
  }
}

const users = (userRepo: UserRepository): typeof sdk.users => {
  return {
    getOrCreateUser: userRepo.getOrCreate.bind(userRepo),
    updateAttributes: userRepo.updateAttributes.bind(userRepo),
    getAttributes: userRepo.getAttributes.bind(userRepo),
    setAttributes: userRepo.setAttributes.bind(userRepo),
    getAllUsers: userRepo.getAllUsers.bind(userRepo),
    getUserCount: userRepo.getUserCount.bind(userRepo)
  }
}

const kvs = (kvs: KeyValueStore): typeof sdk.kvs => {
  return {
    forBot: kvs.forBot.bind(kvs),
    global: kvs.global.bind(kvs),
    get: kvs.get.bind(kvs),
    set: kvs.set.bind(kvs),
    getStorageWithExpiry: kvs.getStorageWithExpiry.bind(kvs),
    setStorageWithExpiry: kvs.setStorageWithExpiry.bind(kvs),
    removeStorageKeysStartingWith: kvs.removeStorageKeysStartingWith.bind(kvs),
    getConversationStorageKey: kvs.getConversationStorageKey.bind(kvs),
    getUserStorageKey: kvs.getUserStorageKey.bind(kvs),
    getGlobalStorageKey: kvs.getGlobalStorageKey.bind(kvs)
  }
}

const notifications = (notificationService: NotificationsService): typeof sdk.notifications => {
  return {
    async create(botId: string, notification: any): Promise<any> {
      await notificationService.create(botId, notification)
    }
  }
}

const security = (): typeof sdk.security => {
  return {
    getMessageSignature
  }
}

const ghost = (ghostService: GhostService): typeof sdk.ghost => {
  return {
    forBot: ghostService.forBot.bind(ghostService),
    forBots: ghostService.bots.bind(ghostService),
    forGlobal: ghostService.global.bind(ghostService),
    forRoot: ghostService.root.bind(ghostService)
  }
}

const cms = (cmsService: CMSService, mediaService: MediaService): typeof sdk.cms => {
  return {
    getContentElement: cmsService.getContentElement.bind(cmsService),
    getContentElements: cmsService.getContentElements.bind(cmsService),
    listContentElements: cmsService.listContentElements.bind(cmsService),
    deleteContentElements: cmsService.deleteContentElements.bind(cmsService),
    getAllContentTypes(botId?: string): Promise<any[]> {
      return cmsService.getAllContentTypes(botId)
    },
    renderElement(contentId: string, args: any, eventDestination: sdk.IO.EventDestination): Promise<any> {
      return cmsService.renderElement(contentId, args, eventDestination)
    },
    createOrUpdateContentElement: cmsService.createOrUpdateContentElement.bind(cmsService),
    async saveFile(botId: string, fileName: string, content: Buffer): Promise<string> {
      return mediaService.saveFile(botId, fileName, content)
    },
    async readFile(botId, fileName): Promise<Buffer> {
      return mediaService.readFile(botId, fileName)
    },
    getFilePath(botId: string, fileName: string): string {
      return mediaService.getFilePath(botId, fileName)
    },
    renderTemplate(templateItem: sdk.cms.TemplateItem, context): sdk.cms.TemplateItem {
      return renderRecursive(templateItem, context)
    }
  }
}

const workspaces = (workspaceService: WorkspaceService): typeof sdk.workspaces => {
  return {
    getBotWorkspaceId: workspaceService.getBotWorkspaceId.bind(workspaceService),
    getWorkspaceRollout: workspaceService.getWorkspaceRollout.bind(workspaceService),
    addUserToWorkspace: workspaceService.addUserToWorkspace.bind(workspaceService),
    consumeInviteCode: workspaceService.consumeInviteCode.bind(workspaceService),
    getWorkspaceUsers: workspaceService.getWorkspaceUsers.bind(workspaceService)
  }
}

const distributed = (jobService: JobService): typeof sdk.distributed => {
  return {
    broadcast: jobService.broadcast.bind(jobService),
    acquireLock: jobService.acquireLock.bind(jobService),
    clearLock: jobService.clearLock.bind(jobService)
  }
}

const experimental = (hookService: HookService): typeof sdk.experimental => {
  return {
    disableHook: hookService.disableHook.bind(hookService),
    enableHook: hookService.enableHook.bind(hookService)
  }
}

/**
 * Socket.IO API to emit payloads to front-end clients
 */
export class RealTimeAPI implements RealTimeAPI {
  constructor(private realtimeService: RealtimeService) {}

  sendPayload(payload: RealTimePayload) {
    this.realtimeService.sendToSocket(payload)
  }
}

@injectable()
export class BotpressAPIProvider {
  http: (owner: string) => typeof sdk.http
  events: typeof sdk.events
  dialog: typeof sdk.dialog
  config: typeof sdk.config
  realtime: RealTimeAPI
  database: Knex & sdk.KnexExtension
  users: typeof sdk.users
  kvs: typeof sdk.kvs
  notifications: typeof sdk.notifications
  bots: typeof sdk.bots
  ghost: typeof sdk.ghost
  cms: typeof sdk.cms
  mlToolkit: typeof sdk.MLToolkit
  experimental: typeof sdk.experimental
  security: typeof sdk.security
  workspaces: typeof sdk.workspaces
  distributed: typeof sdk.distributed

  constructor(
    @inject(TYPES.DialogEngine) dialogEngine: DialogEngine,
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.EventEngine) eventEngine: EventEngine,
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.HTTPServer) httpServer: HTTPServer,
    @inject(TYPES.UserRepository) userRepo: UserRepository,
    @inject(TYPES.RealtimeService) realtimeService: RealtimeService,
    @inject(TYPES.KeyValueStore) keyValueStore: KeyValueStore,
    @inject(TYPES.NotificationsService) notificationService: NotificationsService,
    @inject(TYPES.BotService) botService: BotService,
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.CMSService) cmsService: CMSService,
    @inject(TYPES.ConfigProvider) configProvider: ConfigProvider,
    @inject(TYPES.MediaService) mediaService: MediaService,
    @inject(TYPES.HookService) hookService: HookService,
    @inject(TYPES.EventRepository) eventRepo: EventRepository,
    @inject(TYPES.WorkspaceService) workspaceService: WorkspaceService,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.StateManager) stateManager: StateManager
  ) {
    this.http = http(httpServer)
    this.events = event(eventEngine, eventRepo)
    this.dialog = dialog(dialogEngine, stateManager, moduleLoader)
    this.config = config(moduleLoader, configProvider)
    this.realtime = new RealTimeAPI(realtimeService)
    this.database = db.knex
    this.users = users(userRepo)
    this.kvs = kvs(keyValueStore)
    this.notifications = notifications(notificationService)
    this.bots = bots(botService)
    this.ghost = ghost(ghostService)
    this.cms = cms(cmsService, mediaService)
    this.mlToolkit = MLToolkit
    this.experimental = experimental(hookService)
    this.security = security()
    this.workspaces = workspaces(workspaceService)
    this.distributed = distributed(jobService)
  }

  @Memoize()
  async create(loggerName: string, owner: string): Promise<typeof sdk> {
    return {
      version: '',
      RealTimePayload,
      LoggerLevel: require('./sdk/enums').LoggerLevel,
      LogLevel: require('./sdk/enums').LogLevel,
      NodeActionType: require('./sdk/enums').NodeActionType,
      IO: {
        Event,
        WellKnownFlags
      },
      MLToolkit: this.mlToolkit,
      dialog: this.dialog,
      events: this.events,
      http: this.http(owner),
      logger: await this.loggerProvider(loggerName),
      config: this.config,
      database: this.database,
      users: this.users,
      realtime: this.realtime,
      kvs: this.kvs,
      notifications: this.notifications,
      ghost: this.ghost,
      bots: this.bots,
      cms: this.cms,
      security: this.security,
      experimental: this.experimental,
      workspaces: this.workspaces,
      distributed: this.distributed,
      NLU: {
        makeEngine: async (config: sdk.NLU.Config, logger: sdk.NLU.Logger) => {
          const { ducklingEnabled, ducklingURL, languageSources, modelCacheSize } = config
          const langConfig = { ducklingEnabled, ducklingURL, languageSources }
          const engine = new Engine({ maxCacheSize: modelCacheSize })
          await engine.initialize(langConfig, logger)
          return engine
        },
        errors: {
          isTrainingAlreadyStarted,
          isTrainingCanceled
        }
      }
    }
  }
}

export function createForModule(moduleId: string): Promise<typeof sdk> {
  // return Promise.resolve(<typeof sdk>{})
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Mod[${moduleId}]`, `module.${moduleId}`)
}

export function createForGlobalHooks(): Promise<typeof sdk> {
  // return Promise.resolve(<typeof sdk>{})
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create('Hooks', 'hooks')
}

export function createForBotpress(): Promise<typeof sdk> {
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create('Botpress', 'botpress')
}

export function createForAction(): Promise<typeof sdk> {
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create('Actions', 'actions')
}
