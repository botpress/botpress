import { Logger } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { createForGlobalHooks } from './api'
import { BotConfig } from './config/bot.config'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { ModuleLoader } from './module-loader'
import { GhostService } from './services'
import { CMSService } from './services/cms/cms-service'
import { Hooks, HookService } from './services/hook/hook-service'
import { TYPES } from './types'

@injectable()
export class BotLoader {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotLoader')
    private logger: Logger,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.HookService) private hookService: HookService
  ) {}

  public async getAllBotIds(): Promise<string[]> {
    return this.database
      .knex('srv_bots')
      .select('id')
      .then<any[]>()
      .map(x => x['id'] as string)
  }

  public async getAllBots(): Promise<Map<string, BotConfig>> {
    const botIds = await this.getAllBotIds()
    const bots = new Map<string, BotConfig>()

    for (const botId of botIds) {
      try {
        bots.set(botId, await this.configProvider.getBotConfig(botId))
      } catch (err) {
        this.logger.attachError(err).error(`Bot configuration file not found for bot "${botId}"`)
      }
    }

    return bots
  }

  async loadAllBots() {
    const bots = await this.getAllBots()
    await this.cms.preloadContentForAllBots(Array.from(bots.keys()))
  }

  async mountBot(botId: string, shouldLoadContentElements?: boolean) {
    await this.ghost.forBot(botId).sync(['actions', 'content-elements', 'flows', 'intents'])

    if (shouldLoadContentElements) {
      await this.cms.loadContentElementsForBot(botId)
    }

    await this.moduleLoader.loadModulesForBot(botId)

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotMount(api, botId))
  }

  async unmountBot(botId: string) {
    await this.cms.unloadContentElementsForBot(botId)
    this.moduleLoader.unloadModulesForBot(botId)

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotUnmount(api, botId))
  }
}
