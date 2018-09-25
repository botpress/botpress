import * as sdk from 'botpress/sdk'

// import Knex from 'knex'

// import { Payload } from 'common/realtime'
// import { inject, injectable } from 'inversify'
// import { Memoize } from 'lodash-decorators'

// import { container } from './app.inversify'
// import Database from './database'
// import { LoggerProvider } from './logger'
// import { TYPES } from './types'
// import { ModuleLoader } from './module-loader'
// import { UserRepository } from './repositories'
// import HTTPServer from './server'
// import { DialogEngine } from './services/dialog/engine'
// import { SessionService } from './services/dialog/session/service'
// import { EventEngine } from './services/middleware/event-engine'
// import RealtimeService from './services/realtime'

// class Http implements HttpAPI {
//   constructor(private httpServer: HTTPServer) {}

//   createShortLink(): void {
//     throw new Error('Method not implemented.')
//   }

//   createRouterForBot(routerName: string, options?: RouterOptions): SubRouter {
//     const defaultRouterOptions = { checkAuthentication: true, enableJsonBodyParser: true }
//     return this.httpServer.createRouterForBot(routerName, options || defaultRouterOptions)
//   }
// }

// const event = (eventEngine: EventEngine): EventAPI => {
//   return {
//     registerMiddleware(middleware: IO.MiddlewareDefinition) {
//       eventEngine.register(middleware)
//     },
//     sendEvent(event: IO.Event): void {
//       eventEngine.sendEvent(event)
//     }
//   }
// }

// const dialog = (dialogEngine: DialogEngine, sessionService: SessionService): DialogAPI => {
//   return {
//     async processMessage(userId: string, event: IO.Event): Promise<void> {
//       await dialogEngine.processEvent(event.botId, userId, event)
//     },
//     async deleteSession(userId: string): Promise<void> {
//       await sessionService.deleteSession(userId)
//     },
//     async getState(userId: string): Promise<void> {
//       return sessionService.getStateForSession(userId)
//     },
//     async setState(userId: string, state: any): Promise<void> {
//       await sessionService.updateStateForSession(userId, state)
//     }
//   }
// }

// const config = (moduleLoader: ModuleLoader): ConfigAPI => {
//   return {
//     getModuleConfig(moduleId: string): Promise<any> {
//       return moduleLoader.configReader.getGlobal(moduleId)
//     },
//     getModuleConfigForBot(moduleId: string, botId: string): Promise<any> {
//       return moduleLoader.configReader.getForBot(moduleId, botId)
//     }
//   }
// }

// const users = (userRepo: UserRepository): UserAPI => {
//   return {
//     getOrCreateUser: userRepo.getOrCreate.bind(userRepo),
//     updateAttributes: userRepo.updateAttributes.bind(userRepo)
//   }
// }

// /**
//  * Socket.IO API to emit payloads to front-end clients
//  */
// export class RealTimeAPI implements RealTimeAPI {
//   constructor(private realtimeService: RealtimeService) {}

//   sendPayload(payload: Payload) {
//     this.realtimeService.sendToSocket(payload)
//   }
// }

// @injectable()
// export class BotpressAPIProvider {
//   http: HttpAPI
//   events: EventAPI
//   dialog: DialogAPI
//   config: ConfigAPI
//   realtime: RealTimeAPI
//   database: Knex
//   users: UserAPI

//   constructor(
//     @inject(TYPES.DialogEngine) dialogEngine: DialogEngine,
//     @inject(TYPES.Database) db: Database,
//     @inject(TYPES.EventEngine) eventEngine: EventEngine,
//     @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
//     @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
//     @inject(TYPES.HTTPServer) httpServer: HTTPServer,
//     @inject(TYPES.UserRepository) userRepo: UserRepository,
//     @inject(TYPES.RealtimeService) realtimeService: RealtimeService,
//     @inject(TYPES.SessionService) sessionService: SessionService
//   ) {
//     this.http = new Http(httpServer)
//     this.events = event(eventEngine)
//     this.dialog = dialog(dialogEngine, sessionService)
//     this.config = config(moduleLoader)
//     this.realtime = new RealTimeAPI(realtimeService)
//     this.database = db.knex
//     this.users = users(userRepo)
//   }

//   @Memoize()
//   async create(loggerName: string): Promise<CoreSDK> {
//     return {
//       dialog: this.dialog,
//       events: this.events,
//       http: this.http,
//       logger: await this.loggerProvider(loggerName),
//       config: this.config,
//       database: this.database,
//       users: this.users,
//       realtime: this.realtime
//     } as CoreSDK
//   }
// }

export function createForModule(moduleId: string): Promise<typeof sdk> {
  return Promise.resolve(<typeof sdk>{})
  // return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Mod[${moduleId}]`)
}

export function createForGlobalHooks(): Promise<typeof sdk> {
  return Promise.resolve(<typeof sdk>{})
  // return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Hooks`)
}
