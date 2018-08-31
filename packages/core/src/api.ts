import {
  BotpressAPI,
  BotpressEvent,
  ChannelOutgoingHandler,
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

import { inject, injectable, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'

import { container } from './app.inversify'
import Database from './database'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'
import { BotRepository } from './repositories/bot-repository'
import { UserRepository } from './repositories/user-repository'
import { BotsRouter } from './routers'
import HTTPServer from './server'
import ActionService from './services/action/action-service'
import { CMSService } from './services/cms/cms-service'
import { DialogEngine } from './services/dialog/engine'
import FlowService from './services/dialog/flow-service'
import { EventEngine } from './services/middleware/event-engine'
import { LoggerProvider } from './Logger'

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
    },
    registerOutgoingChannelHandler(channelHandler: ChannelOutgoingHandler) {
      eventEngine.registerOutgoingChannelHandler(channelHandler)
    }
  }
}

const dialog = (dialogEngine: DialogEngine): DialogAPI => {
  return {
    async processMessage(botId: string, event: BotpressEvent): Promise<void> {
      await dialogEngine.forBot(BOT_ID).processMessage(botId, event)
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
 * Socket.IO API to emit events and listen
 */
export class RealTimeAPI {
  emit() {}
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
    @inject(TYPES.BotRepository) botRepository: BotRepository,
    @inject(TYPES.CMSService) cmsService: CMSService,
    @inject(TYPES.DialogEngine) dialogEngine: DialogEngine,
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.FlowService) flowService: FlowService,
    @inject(TYPES.EventEngine) eventEngine: EventEngine,
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.ActionService) actionService: ActionService,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.HTTPServer) httpServer: HTTPServer,
    @inject(TYPES.UserRepository) userRepo: UserRepository
  ) {
    this.http = new Http(httpServer)
    this.events = event(eventEngine)
    this.dialog = dialog(dialogEngine)
    this.config = config(moduleLoader)
    this.realtime = new RealTimeAPI()
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
      users: this.users
    } as BotpressAPI
  }
}

export function createForModule(moduleId: string): Promise<BotpressAPI> {
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Mod[${moduleId}]`)
}
