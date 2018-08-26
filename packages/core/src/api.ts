import { BotpressAPI, BotpressEvent, EventAPI, HttpAPI, LoggerAPI, MiddlewareDefinition } from 'botpress-module-sdk'
import { Logger } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'

import { container } from './app.inversify'
import Database from './database'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'
import { BotRepository } from './repositories/bot-repository'
import { BotRouter } from './router/bot-router'
import ActionService from './services/action/action-service'
import { CMSService } from './services/cms/cms-service'
import { DialogEngine } from './services/dialog/engine'
import FlowService from './services/dialog/flow-service'
import { EventEngine } from './services/middleware/event-engine'
import { LoggerProvider } from './Logger'

// TODO: The UI doesn't support multi-bots yet
const BOT_ID = 'bot123'

const http = (botRouter: BotRouter): HttpAPI => {
  return {
    createShortLink: () => {}
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

export class DialogAPI {
  constructor(private dialogEngine: DialogEngine) {}

  processMessage(sessionID: string, event: BotpressEvent) {
    return this.dialogEngine.forBot(BOT_ID).processMessage(sessionID, event)
  }
}

export class ConfigAPI {
  constructor(private moduleLoader: ModuleLoader) {}

  getModuleConfig(moduleId: string): Promise<any> {
    return this.moduleLoader.configReader.getGlobal(moduleId)
  }

  getModuleConfigForBot(moduleId: string, botId: string): Promise<any> {
    return this.moduleLoader.configReader.getForBot(moduleId, botId)
  }
}

export class ConsoleAPI {
  constructor(private logger: Logger) {}

  debug(msg) {
    this.logger.debug(msg)
  }

  info(msg) {
    this.logger.info(msg)
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
  database: Database

  constructor(
    @inject(TYPES.BotRepository) botRepository: BotRepository,
    @inject(TYPES.CMSService) cmsService: CMSService,
    @inject(TYPES.DialogEngine) dialogEngine: DialogEngine,
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.FlowService) flowService: FlowService,
    @inject(TYPES.EventEngine) eventEngine: EventEngine,
    @inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader,
    @inject(TYPES.ActionService) actionService: ActionService,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider
  ) {
    const botRouter = new BotRouter({ botRepository, cmsService, flowService, actionService })

    this.http = http(botRouter)
    this.events = event(eventEngine)
    this.dialog = new DialogAPI(dialogEngine)
    this.config = new ConfigAPI(moduleLoader)
    this.realtime = new RealTimeAPI()
    this.database = db
  }

  @Memoize()
  async create(loggerName: string): Promise<BotpressAPI> {
    return {
      dialog: this.dialog,
      events: this.events,
      http: this.http,
      logger: await this.loggerProvider(loggerName)
    } as BotpressAPI
  }
}

export function createForModule(moduleId: string): Promise<BotpressAPI> {
  return container.get<BotpressAPIProvider>(TYPES.BotpressAPIProvider).create(`Mod[${moduleId}]`)
}
