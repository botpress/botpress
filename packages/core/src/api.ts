import {
  BotpressAPI,
  BotpressEvent,
  ConfigAPI,
  DialogAPI,
  EventAPI,
  ExtendedKnex,
  HttpAPI,
  MiddlewareDefinition,
  RouterOptions,
  SubRouter,
  UserAPI
} from 'botpress-module-sdk'
import { RealTimePayload } from 'botpress-module-sdk/dist/src/realtime'
import { inject, injectable } from 'inversify'
import { Memoize } from 'lodash-decorators'

import { container } from './app.inversify'
import Database from './database'
import { LoggerProvider } from './logger'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'
import { UserRepository } from './repositories/user-repository'
import HTTPServer from './server'
import { DialogEngine } from './services/dialog/engine'
import { SessionService } from './services/dialog/session/service'
import { LogsService } from './services/logs/service'
import { EventEngine } from './services/middleware/event-engine'
import RealtimeService from './services/realtime'

// TODO: The UI doesn't support multi-bots yet
const BOT_ID = 'bot123'

class Http implements HttpAPI {
  constructor(private httpServer: HTTPServer) {}

  createShortLink(): void {
    throw new Error('Method not implemented.')
  }

  createRouterForBot(routerName: string, options?: RouterOptions): SubRouter {
    const defaultRouterOptions = { checkAuthentication: true, enableJsonBodyParser: true }
    return this.httpServer.createRouterForBot(routerName, options || defaultRouterOptions)
  }
}

const event = (eventEngine: EventEngine): EventAPI => {
  return {
    registerMiddleware(middleware: MiddlewareDefinition) {
      eventEngine.register(middleware)
    },
    sendEvent(event: BotpressEvent): void {
      eventEngine.sendEvent(BOT_ID, event)
    }
  }
}

const dialog = (dialogEngine: DialogEngine, sessionService: SessionService): DialogAPI => {
  return {
    async processMessage(botId: string, event: BotpressEvent): Promise<void> {
      await dialogEngine.processEvent(botId, botId, event)
    },
    async deleteSession(userId: string): Promise<void> {
      await sessionService.deleteSession(userId)
    },
    async getState(userId: string): Promise<void> {
      return sessionService.getStateForSession(userId)
    },
    async setState(userId: string, state: any): Promise<void> {
      await sessionService.updateStateForSession(userId, state)
    }
  }
}

const config = (moduleLoader: ModuleLoader): ConfigAPI => {
  return {
    getModuleConfig(moduleId: string): Promise<any> {
      return moduleLoader.configReader.getGlobal(moduleId)
    },

    getModuleConfigForBot(moduleId: string, botId: string): Promise<any> {
      return moduleLoader.configReader.getForBot(moduleId, botId)
    }
  }
}

const users = (userRepo: UserRepository): UserAPI => {
  return {
    getOrCreateUser: userRepo.getOrCreate.bind(userRepo),
    updateAttributes: userRepo.updateAttributes.bind(userRepo)
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
  http: HttpAPI
  events: EventAPI
  dialog: DialogAPI
  config: ConfigAPI
  realtime: RealTimeAPI
  database: ExtendedKnex
  users: UserAPI

  constructor(
    @inject(TYPES.DialogEngine) dialogEngine: DialogEngine,
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.EventEngine) eventEngine: EventEngine,
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.HTTPServer) httpServer: HTTPServer,
    @inject(TYPES.UserRepository) userRepo: UserRepository,
    @inject(TYPES.RealtimeService) realtimeService: RealtimeService,
    @inject(TYPES.SessionService) sessionService: SessionService,
    @inject(TYPES.LogsService) logsService: LogsService
  ) {
    this.http = new Http(httpServer)
    this.events = event(eventEngine)
    this.dialog = dialog(dialogEngine, sessionService)
    this.config = config(moduleLoader)
    this.realtime = new RealTimeAPI(realtimeService)
    this.database = db.knex
    this.users = users(userRepo)
  }

  @Memoize()
  async create(loggerName: string): Promise<BotpressAPI> {
    return {
      dialog: this.dialog,
      events: this.events,
      http: this.http,
      logger: await this.loggerProvider(loggerName),
      config: this.config,
      database: this.database,
      users: this.users,
      realtime: this.realtime
    } as BotpressAPI
  }
}

export function createForModule(moduleId: string): Promise<BotpressAPI> {
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Mod[${moduleId}]`)
}

export function createForGlobalHooks(): Promise<BotpressAPI> {
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Hooks`)
}
