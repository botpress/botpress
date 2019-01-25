import { Logger } from 'botpress/sdk'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import _ from 'lodash'

import { createForGlobalHooks } from './api'
import { BotConfig } from './config/bot.config'
import { ConfigProvider } from './config/config-loader'
import { ModuleLoader } from './module-loader'
import { GhostService } from './services'
import { CMSService } from './services/cms'
import { Hooks, HookService } from './services/hook/hook-service'
import { JobService } from './services/job-service'
import { TYPES } from './types'

@injectable()
export class BotLoader {
  public mountBot: Function = this._mountBot
  public unmountBot: Function = this._unmountBot
  private _botIds: string[] | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotLoader')
    private logger: Logger,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    this._botIds = undefined
  }

  @postConstruct()
  async init() {
    this.mountBot = await this.jobService.broadcast<void>(this._mountBot.bind(this))
    this.unmountBot = await this.jobService.broadcast<void>(this._unmountBot.bind(this))
  }

  public invalidateBotIds(): void {
    this._botIds = undefined
  }

  public async getGhostBotsIds(): Promise<string[]> {
    if (this._botIds) {
      return this._botIds
    }

    const bots = await this.ghost.bots().directoryListing('/', '*bot.config.json')
    return (this._botIds = _.map(bots, x => x.split('/')[0]))
  }

  public async getAllBots(): Promise<Map<string, BotConfig>> {
    const botIds = await this.getGhostBotsIds()
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

  private async _mountBot(botId: string) {
    await this.ghost.forBot(botId).sync(['actions', 'content-elements', 'flows', 'intents'])
    await this.cms.loadContentElementsForBot(botId)
    await this.moduleLoader.loadModulesForBot(botId)

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotMount(api, botId))
  }

  private async _unmountBot(botId: string) {
    await this.cms.unloadContentElementsForBot(botId)
    this.moduleLoader.unloadModulesForBot(botId)

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotUnmount(api, botId))
  }
}
