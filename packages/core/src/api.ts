import { inject, injectable } from 'inversify'

import { container } from './app.inversify'
import Database from './database'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'
import { BotRepository } from './repositories/bot-repository'
import { BotRouter } from './router/bot-router'
import { CMSService } from './services/cms/cms-service'
import { DialogEngine } from './services/dialog/engine'
import FlowService from './services/dialog/flow-service'
import { BotpressEvent, EventEngine } from './services/middleware/event-engine'
import { MiddlewareService } from './services/middleware/middleware-service'

// TODO: The UI doesn't support multi-bots yet
const BOT_ID = 'bot123'

export class HttpApi {
  constructor(private botRouter: BotRouter) {}

  get router() {
    return this.botRouter.router
  }
}

export class EventAPI {
  constructor(private eventEngine: EventEngine) {}

  sendIncoming(event) {
    this.eventEngine.forBot(BOT_ID).sendIncoming(event)
  }

  sendOutgoing(event) {
    this.eventEngine.forBot(BOT_ID).sendOutgoing(event)
  }

  emit() {
    // socket
  }
}

export class DialogAPI {
  constructor(private dialogEngine: DialogEngine) {}

  processMessage() {
    // this.dialogEngine.forBot(BOT_ID).processMessage()
  }
}

export class MiddlewareAPI {
  constructor(private middlewareService: MiddlewareService) {}

  register() {
    // this.middlewareService
  }
}

export class ModuleAPI {
  constructor(private moduleLoader: ModuleLoader) {}

  stuff() {}
}

@injectable()
export class BotpressAPI {
  // http: {} // getRouter(), createShortLink()
  // io: {} // sendIncoming, sendOutgoing
  // dialog: {}
  // middleware: {} // register

  // config provider
  public http: HttpApi
  public events: EventAPI
  public dialog: DialogAPI
  public middleware: MiddlewareAPI
  public module: ModuleAPI

  constructor(
    @inject(TYPES.BotRepository) private botRepository: BotRepository,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.MiddlewareService) private mwareService: MiddlewareService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.Logger) private logger: Logger
  ) {
    const botRouter = new BotRouter(this.botRepository, this.mwareService, this.cmsService, this.flowService)

    this.http = new HttpApi(botRouter)
    this.events = new EventAPI(this.eventEngine)
    this.dialog = new DialogAPI(this.dialogEngine)
    this.middleware = new MiddlewareAPI(this.mwareService)
    this.module = new ModuleAPI(this.moduleLoader)
  }
}

export const botpressAPI = () => {
  return container.get<BotpressAPI>(TYPES.BotpressAPI)
}
