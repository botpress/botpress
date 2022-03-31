import * as sdk from 'botpress/runtime-sdk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'

import { BotService } from '../bots'
import { GhostService, ScopedGhostService } from '../bpfs'
import { CMSService, renderRecursive } from '../cms'
import * as renderEnums from '../cms/enums'
import { StateManager, DialogEngine, WellKnownFlags } from '../dialog'
import * as dialogEnums from '../dialog/enums'
import { SessionIdFactory } from '../dialog/sessions'
import { EventEngine, EventRepository, Event } from '../events'
import { KeyValueStore, KvsService } from '../kvs'
import { LoggerProvider } from '../logger'
import * as logEnums from '../logger/enums'
import { getMessageSignature } from '../security'
import { ChannelUserRepository } from '../users'

import { container } from './inversify/app.inversify'
import { TYPES } from './types'

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

const bots = (botService: BotService): typeof sdk.bots => {
  return {
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

const scopedKvs = (scopedKvs: KvsService): sdk.KvsService => {
  return {
    get: scopedKvs.get.bind(scopedKvs),
    set: scopedKvs.set.bind(scopedKvs),
    delete: scopedKvs.delete.bind(scopedKvs),
    exists: scopedKvs.exists.bind(scopedKvs),
    setStorageWithExpiry: scopedKvs.setStorageWithExpiry.bind(scopedKvs),
    getStorageWithExpiry: scopedKvs.getStorageWithExpiry.bind(scopedKvs),
    removeStorageKeysStartingWith: scopedKvs.removeStorageKeysStartingWith.bind(scopedKvs),
    getConversationStorageKey: scopedKvs.getConversationStorageKey.bind(scopedKvs),
    getUserStorageKey: scopedKvs.getUserStorageKey.bind(scopedKvs),
    getGlobalStorageKey: scopedKvs.getGlobalStorageKey.bind(scopedKvs)
  }
}

const kvs = (kvs: KeyValueStore): typeof sdk.kvs => {
  return {
    forBot: (botId: string) => scopedKvs(kvs.forBot(botId))
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
    fileExists: scopedGhost.fileExists.bind(scopedGhost)
  }
}

const ghost = (ghostService: GhostService): typeof sdk.ghost => {
  return {
    forBot: (botId: string) => scopedGhost(ghostService.forBot(botId))
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

@injectable()
export class BotpressRuntimeAPIProvider {
  events: typeof sdk.events
  dialog: typeof sdk.dialog
  users: typeof sdk.users
  kvs: typeof sdk.kvs
  bots: typeof sdk.bots
  ghost: typeof sdk.ghost
  cms: typeof sdk.cms
  security: typeof sdk.security

  constructor(
    @inject(TYPES.DialogEngine) dialogEngine: DialogEngine,
    @inject(TYPES.EventEngine) eventEngine: EventEngine,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.UserRepository) userRepo: ChannelUserRepository,
    @inject(TYPES.KeyValueStore) keyValueStore: KeyValueStore,
    @inject(TYPES.BotService) botService: BotService,
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.CMSService) cmsService: CMSService,
    @inject(TYPES.EventRepository) eventRepo: EventRepository,
    @inject(TYPES.StateManager) stateManager: StateManager
  ) {
    this.events = event(eventEngine, eventRepo)
    this.dialog = dialog(dialogEngine, stateManager)
    this.users = users(userRepo)
    this.kvs = kvs(keyValueStore)
    this.bots = bots(botService)
    this.ghost = ghost(ghostService)
    this.cms = cms(cmsService)
    this.security = security()
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
      users: this.users,
      kvs: this.kvs,
      ghost: this.ghost,
      bots: this.bots,
      cms: this.cms,
      security: this.security,
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
