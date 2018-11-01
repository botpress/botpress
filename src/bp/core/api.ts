import * as sdk from 'botpress/sdk'
import { WellKnownFlags } from 'core/sdk/enums'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import { Memoize } from 'lodash-decorators'

import { container } from './app.inversify'
import { BotLoader } from './bot-loader'
import { BotConfig } from './config/bot.config'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { LoggerProvider } from './logger'
import { ModuleLoader } from './module-loader'
import { UserRepository } from './repositories'
import { Event, RealTimePayload } from './sdk/impl'
import HTTPServer from './server'
import { GhostService } from './services'
import { CMSService } from './services/cms/cms-service'
import { DialogEngineV2 } from './services/dialog/engine-v2'
import { SessionIdFactory } from './services/dialog/session/id-factory'
import { SessionService } from './services/dialog/session/service'
import { ScopedGhostService } from './services/ghost/service'
import { KeyValueStore } from './services/kvs/kvs'
import { EventEngine } from './services/middleware/event-engine'
import { NotificationsService } from './services/notification/service'
import RealtimeService from './services/realtime'
import { TYPES } from './types'

const http = (httpServer: HTTPServer): typeof sdk.http => {
  return {
    createShortLink(name: string, destination: string, params?: any): void {
      httpServer.createShortLink(name, destination, params)
    },
    createRouterForBot(routerName: string, options?: sdk.RouterOptions): any {
      const defaultRouterOptions = { checkAuthentication: true, enableJsonBodyParser: true }
      return httpServer.createRouterForBot(routerName, options || defaultRouterOptions)
    },
    async getAxiosConfigForBot(botId: string): Promise<any> {
      return httpServer.getAxiosConfigForBot(botId)
    }
  }
}

const event = (eventEngine: EventEngine): typeof sdk.events => {
  return {
    registerMiddleware(middleware: sdk.IO.MiddlewareDefinition) {
      eventEngine.register(middleware)
    },
    sendEvent(event: sdk.IO.Event): void {
      eventEngine.sendEvent(event)
    },
    replyToEvent(event: sdk.IO.Event, payloads: any[]): void {
      eventEngine.replyToEvent(event, payloads)
    }
  }
}

const dialog = (dialogEngine: DialogEngineV2, sessionService: SessionService): typeof sdk.dialog => {
  return {
    async createId(event: sdk.IO.Event) {
      return SessionIdFactory.createIdFromEvent(event)
    },
    async processEvent(sessionId: string, event: sdk.IO.Event): Promise<void> {
      await dialogEngine.processEvent(sessionId, event)
    },
    async deleteSession(userId: string): Promise<void> {
      await sessionService.deleteSession(userId)
    },
    async getState(userId: string): Promise<void> {
      return sessionService.getStateForSession(userId)
    },
    async setState(userId: string, state: any): Promise<void> {
      await sessionService.updateStateForSession(userId, state)
    },
    async jumpTo(sessionId: string, event: any, flowName: string, nodeName?: string): Promise<void> {
      await dialogEngine.jumpTo(sessionId, event, flowName, nodeName)
    }
  }
}

const config = (moduleLoader: ModuleLoader, configProfider: ConfigProvider): typeof sdk.config => {
  return {
    getModuleConfig(moduleId: string): Promise<any> {
      return moduleLoader.configReader.getGlobal(moduleId)
    },
    getModuleConfigForBot(moduleId: string, botId: string): Promise<any> {
      return moduleLoader.configReader.getForBot(moduleId, botId)
    },
    getBotpressConfig(): Promise<any> {
      return configProfider.getBotpressConfig()
    }
  }
}

const bots = (botLoader: BotLoader): typeof sdk.bots => {
  return {
    getAllBots(): Promise<Map<string, BotConfig>> {
      return botLoader.getAllBots()
    }
  }
}

const users = (userRepo: UserRepository): typeof sdk.users => {
  return {
    getOrCreateUser: userRepo.getOrCreate.bind(userRepo),
    updateAttributes: userRepo.updateAttributes.bind(userRepo),
    getAllUsers: userRepo.getAllUsers.bind(userRepo),
    getUserCount: userRepo.getUserCount.bind(userRepo)
  }
}

const kvs = (kvs: KeyValueStore): typeof sdk.kvs => {
  return {
    async get(botId: string, key: string, path?: string): Promise<any> {
      return kvs.get(botId, key, path)
    },
    async set(botId: string, key: string, value: string, path?: string) {
      return kvs.set(botId, key, value, path)
    },
    async getStorageWithExpiry(botId, key): Promise<any> {
      return kvs.getStorageWithExpiry(botId, key)
    },
    async setStorageWithExpiry(botId: string, key: string, value, expiryInMs?: string): Promise<void> {
      return kvs.setStorageWithExpiry(botId, key, value, expiryInMs)
    },
    async removeStorageKeysStartingWith(key): Promise<void> {
      return kvs.removeStorageKeysStartingWith(key)
    },
    getConversationStorageKey(sessionId, variable): string {
      return kvs.getConversationStorageKey(sessionId, variable)
    },
    getUserStorageKey(userId, variable): string {
      return kvs.getUserStorageKey(userId, variable)
    },
    getGlobalStorageKey(variable): string {
      return kvs.getGlobalStorageKey(variable)
    }
  }
}

const notifications = (notificationService: NotificationsService): typeof sdk.notifications => {
  return {
    async create(botId: string, notification: any): Promise<any> {
      await notificationService.create(botId, notification)
    }
  }
}

const ghost = (ghostService: GhostService): typeof sdk.ghost => {
  return {
    forBot(botId: string): ScopedGhostService {
      return ghostService.forBot(botId)
    }
  }
}

const cms = (cmsService: CMSService): typeof sdk.cms => {
  return {
    getContentElement(botId: string, id: string): Promise<any> {
      return cmsService.getContentElement(botId, id)
    },
    getContentElements(botId: string, ids: string[]): Promise<any[]> {
      return cmsService.getContentElements(botId, ids)
    },
    listContentElements(botId: string, contentTypeId?: string): Promise<any> {
      return cmsService.listContentElements(botId, contentTypeId)
    },
    getAllContentTypes(botId?: string): Promise<any[]> {
      return cmsService.getAllContentTypes(botId)
    },
    renderElement(contentTypeId: string, payload: any, channel: string): Promise<any> {
      return cmsService.renderElement(contentTypeId, payload, channel)
    },
    createOrUpdateContentElement(
      botId: string,
      contentTypeId: string,
      formData: string,
      contentElementId?: string
    ): Promise<string> {
      return cmsService.createOrUpdateContentElement(botId, contentTypeId, formData, contentElementId)
    }
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
  http: typeof sdk.http
  events: typeof sdk.events
  dialog: typeof sdk.dialog
  config: typeof sdk.config
  realtime: RealTimeAPI
  database: Knex
  users: typeof sdk.users
  kvs: typeof sdk.kvs
  notifications: typeof sdk.notifications
  bots: typeof sdk.bots
  ghost: typeof sdk.ghost
  cms: typeof sdk.cms

  constructor(
    @inject(TYPES.DialogEngine) dialogEngine: DialogEngineV2,
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.EventEngine) eventEngine: EventEngine,
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.HTTPServer) httpServer: HTTPServer,
    @inject(TYPES.UserRepository) userRepo: UserRepository,
    @inject(TYPES.RealtimeService) realtimeService: RealtimeService,
    @inject(TYPES.SessionService) sessionService: SessionService,
    @inject(TYPES.KeyValueStore) keyValueStore: KeyValueStore,
    @inject(TYPES.NotificationsService) notificationService: NotificationsService,
    @inject(TYPES.BotLoader) botLoader: BotLoader,
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.CMSService) cmsService: CMSService,
    @inject(TYPES.ConfigProvider) configProfider: ConfigProvider
  ) {
    this.http = http(httpServer)
    this.events = event(eventEngine)
    this.dialog = dialog(dialogEngine, sessionService)
    this.config = config(moduleLoader, configProfider)
    this.realtime = new RealTimeAPI(realtimeService)
    this.database = db.knex
    this.users = users(userRepo)
    this.kvs = kvs(keyValueStore)
    this.notifications = notifications(notificationService)
    this.bots = bots(botLoader)
    this.ghost = ghost(ghostService)
    this.cms = cms(cmsService)
  }

  @Memoize()
  async create(loggerName: string): Promise<typeof sdk> {
    return {
      version: '',
      RealTimePayload: RealTimePayload,
      LoggerLevel: require('./sdk/enums').LoggerLevel,
      LogLevel: require('./sdk/enums').LogLevel,
      NodeActionType: require('./sdk/enums').NodeActionType,
      IO: {
        Event: Event,
        WellKnownFlags: WellKnownFlags
      },
      dialog: this.dialog,
      events: this.events,
      http: this.http,
      logger: await this.loggerProvider(loggerName),
      config: this.config,
      database: this.database,
      users: this.users,
      realtime: this.realtime,
      kvs: this.kvs,
      notifications: this.notifications,
      ghost: this.ghost,
      bots: this.bots,
      cms: this.cms
    }
  }
}

export function createForModule(moduleId: string): Promise<typeof sdk> {
  // return Promise.resolve(<typeof sdk>{})
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Mod[${moduleId}]`)
}

export function createForGlobalHooks(): Promise<typeof sdk> {
  // return Promise.resolve(<typeof sdk>{})
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Hooks`)
}

export function createForBotpress(): Promise<typeof sdk> {
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Botpress`)
}

export function createForAction(): Promise<typeof sdk> {
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create('Actions')
}
