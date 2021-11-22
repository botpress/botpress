import * as sdk from 'botpress/runtime-sdk'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import { container } from 'runtime/app/inversify/app.inversify'
import { TYPES } from 'runtime/app/types'
import { BotService } from 'runtime/bots'
import { GhostService, ScopedGhostService } from 'runtime/bpfs'
import { CMSService, renderRecursive, RenderService } from 'runtime/cms'
import * as renderEnums from 'runtime/cms/enums'
import { ConfigProvider } from 'runtime/config'
import Database from 'runtime/database'
import { StateManager, DialogEngine, WellKnownFlags } from 'runtime/dialog'
import * as dialogEnums from 'runtime/dialog/enums'
import { SessionIdFactory } from 'runtime/dialog/sessions'
import { JobService } from 'runtime/distributed'
import { EventEngine, EventRepository, Event } from 'runtime/events'
import { KeyValueStore } from 'runtime/kvs'
import { LoggerProvider } from 'runtime/logger'
import * as logEnums from 'runtime/logger/enums'
import { getMessageSignature } from 'runtime/security'
import { HookService } from 'runtime/user-code'
import { ChannelUserRepository } from 'runtime/users'

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

const dialog = (dialogEngine: DialogEngine, stateManager: StateManager): typeof sdk.dialog => {
  return {
    createId: SessionIdFactory.createIdFromEvent.bind(SessionIdFactory),
    processEvent: dialogEngine.processEvent.bind(dialogEngine),
    deleteSession: stateManager.deleteDialogSession.bind(stateManager),
    jumpTo: dialogEngine.jumpTo.bind(dialogEngine)
  }
}

const config = (configProvider: ConfigProvider): typeof sdk.config => {
  return {
    getBotpressConfig: configProvider.getRuntimeConfig.bind(configProvider)
  }
}

const bots = (botService: BotService): typeof sdk.bots => {
  return {
    getAllBots: botService.getBots.bind(botService),
    getBotById: botService.findBotById.bind(botService)
  }
}

const users = (userRepo: ChannelUserRepository): typeof sdk.users => {
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

const security = (): typeof sdk.security => {
  return {
    getMessageSignature
  }
}

const scopedGhost = (scopedGhost: ScopedGhostService): sdk.ScopedGhostService => {
  return {
    readFileAsBuffer: scopedGhost.readFileAsBuffer.bind(scopedGhost),
    readFileAsString: scopedGhost.readFileAsString.bind(scopedGhost),
    readFileAsObject: scopedGhost.readFileAsObject.bind(scopedGhost),
    directoryListing: scopedGhost.directoryListing.bind(scopedGhost),
    onFileChanged: scopedGhost.onFileChanged.bind(scopedGhost),
    fileExists: scopedGhost.fileExists.bind(scopedGhost)
  }
}

const ghost = (ghostService: GhostService): typeof sdk.ghost => {
  return {
    forBot: (botId: string) => scopedGhost(ghostService.forBot(botId)),
    forBots: () => scopedGhost(ghostService.bots()),
    forGlobal: () => scopedGhost(ghostService.global()),
    forRoot: () => scopedGhost(ghostService.root())
  }
}

const cms = (cmsService: CMSService): typeof sdk.cms => {
  return {
    getContentElement: cmsService.getContentElement.bind(cmsService),
    getContentElements: cmsService.getContentElements.bind(cmsService),
    listContentElements: cmsService.listContentElements.bind(cmsService),
    getAllContentTypes(botId: string): Promise<any[]> {
      return cmsService.getAllContentTypes(botId)
    },
    renderElement(contentId: string, args: any, eventDestination: sdk.IO.EventDestination): Promise<any> {
      return cmsService.renderElement(contentId, args, eventDestination)
    },
    renderTemplate(templateItem: sdk.cms.TemplateItem, context): sdk.cms.TemplateItem {
      return renderRecursive(templateItem, context)
    }
  }
}

const distributed = (jobService: JobService): typeof sdk.distributed => {
  return {
    broadcast: jobService.broadcast.bind(jobService),
    acquireLock: jobService.acquireLock.bind(jobService),
    clearLock: jobService.clearLock.bind(jobService)
  }
}

const experimental = (renderService: RenderService): typeof sdk.experimental => {
  return {
    render: render(renderService)
  }
}

const render = (renderService: RenderService): typeof sdk.experimental.render => {
  return {
    text: renderService.renderText.bind(renderService),
    image: renderService.renderImage.bind(renderService),
    audio: renderService.renderAudio.bind(renderService),
    video: renderService.renderVideo.bind(renderService),
    location: renderService.renderLocation.bind(renderService),
    card: renderService.renderCard.bind(renderService),
    carousel: renderService.renderCarousel.bind(renderService),
    choice: renderService.renderChoice.bind(renderService),
    buttonSay: renderService.renderButtonSay.bind(renderService),
    buttonUrl: renderService.renderButtonUrl.bind(renderService),
    buttonPostback: renderService.renderButtonPostback.bind(renderService),
    option: renderService.renderOption.bind(renderService),
    translate: renderService.renderTranslated.bind(renderService),
    template: renderService.renderTemplate.bind(renderService),
    pipeline: renderService.getPipeline.bind(renderService)
  }
}

@injectable()
export class BotpressRuntimeAPIProvider {
  events: typeof sdk.events
  dialog: typeof sdk.dialog
  config: typeof sdk.config
  database: Knex & sdk.KnexExtension
  users: typeof sdk.users
  kvs: typeof sdk.kvs
  bots: typeof sdk.bots
  ghost: typeof sdk.ghost
  cms: typeof sdk.cms
  experimental: typeof sdk.experimental
  security: typeof sdk.security
  distributed: typeof sdk.distributed

  constructor(
    @inject(TYPES.DialogEngine) dialogEngine: DialogEngine,
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.EventEngine) eventEngine: EventEngine,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.UserRepository) userRepo: ChannelUserRepository,
    @inject(TYPES.KeyValueStore) keyValueStore: KeyValueStore,
    @inject(TYPES.BotService) botService: BotService,
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.CMSService) cmsService: CMSService,
    @inject(TYPES.ConfigProvider) configProvider: ConfigProvider,
    @inject(TYPES.HookService) hookService: HookService,
    @inject(TYPES.EventRepository) eventRepo: EventRepository,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.StateManager) stateManager: StateManager,
    @inject(TYPES.RenderService) renderService: RenderService
  ) {
    this.events = event(eventEngine, eventRepo)
    this.dialog = dialog(dialogEngine, stateManager)
    this.config = config(configProvider)
    this.database = db.knex
    this.users = users(userRepo)
    this.kvs = kvs(keyValueStore)
    this.bots = bots(botService)
    this.ghost = ghost(ghostService)
    this.cms = cms(cmsService)
    this.security = security()
    this.distributed = distributed(jobService)
    this.experimental = experimental(renderService)
  }

  @Memoize()
  async create(loggerName: string, owner: string, augmentApi?: any): Promise<typeof sdk> {
    const runtimeApi = {
      version: '',
      LoggerLevel: logEnums.LoggerLevel,
      LogLevel: logEnums.LogLevel,
      NodeActionType: dialogEnums.NodeActionType,
      IO: {
        Event,
        WellKnownFlags
      },
      dialog: this.dialog,
      events: this.events,
      logger: await this.loggerProvider(loggerName),
      config: this.config,
      database: this.database,
      users: this.users,
      kvs: this.kvs,
      ghost: this.ghost,
      bots: this.bots,
      cms: this.cms,
      security: this.security,
      distributed: this.distributed,
      experimental: this.experimental,
      ButtonAction: renderEnums.ButtonAction
    }

    if (augmentApi) {
      return _.merge(runtimeApi, augmentApi)
    }

    return runtimeApi
  }
}

export function createForGlobalHooks(augmentApi?: any): Promise<typeof sdk> {
  return container.get<BotpressRuntimeAPIProvider>(TYPES.BotpressAPIProvider).create('Hooks', 'hooks', augmentApi)
}

export function createForAction(augmentApi?: any): Promise<typeof sdk> {
  return container.get<BotpressRuntimeAPIProvider>(TYPES.BotpressAPIProvider).create('Actions', 'actions', augmentApi)
}
