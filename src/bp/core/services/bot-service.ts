import { BotConfig, BotTemplate, Logger } from 'botpress/sdk'
import { BotCreationSchema, BotEditSchema } from 'common/validation'
import { createForGlobalHooks } from 'core/api'
import { BotConfigWriter } from 'core/config'
import { ConfigProvider } from 'core/config/config-loader'
import { Bot } from 'core/misc/interfaces'
import { ModuleLoader } from 'core/module-loader'
import { Statistics } from 'core/stats'
import { TYPES } from 'core/types'
import { FatalError } from 'errors'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'

import { InvalidOperationError } from './auth/errors'
import { CMSService } from './cms'
import { GhostService } from './ghost/service'
import { Hooks, HookService } from './hook/hook-service'
import { JobService } from './job-service'

@injectable()
export class BotService {
  public mountBot: Function = this._mountBot
  public unmountBot: Function = this._unmountBot

  private _botIds: string[] | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotService')
    private logger: Logger,
    @inject(TYPES.BotConfigWriter) private configWriter: BotConfigWriter,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.Statistics) private stats: Statistics
  ) {
    this._botIds = undefined
  }

  @postConstruct()
  async init() {
    this.mountBot = await this.jobService.broadcast<void>(this._mountBot.bind(this))
    this.unmountBot = await this.jobService.broadcast<void>(this._unmountBot.bind(this))
  }

  async getBotById(botId: string): Promise<BotConfig> {
    try {
      return await this.configProvider.getBotConfig(botId)
    } catch (err) {
      throw new FatalError(`Bot "${botId}" not found. Make sure it exists on your filesystem or database.`)
    }
  }

  async getBots(): Promise<Map<string, BotConfig>> {
    const botIds = await this.getBotsIds()
    const bots = new Map<string, BotConfig>()

    for (const botId of botIds) {
      try {
        bots.set(botId, await this.getBotById(botId))
      } catch (err) {
        this.logger.attachError(err).error(`Bot configuration file not found for bot "${botId}"`)
      }
    }

    return bots
  }

  async getBotsIds(): Promise<string[]> {
    if (this._botIds) {
      return this._botIds
    }

    const bots = await this.ghostService.bots().directoryListing('/', '*bot.config.json')
    return (this._botIds = _.map(bots, x => x.split('/')[0]))
  }

  async addBot(bot: Bot, botTemplate: BotTemplate): Promise<void> {
    this.stats.track('ce', 'addBot')

    const { error } = Joi.validate(bot, BotCreationSchema)
    if (error) {
      throw new InvalidOperationError(`An error occurred while creating the bot: ${error.message}`)
    }

    await this.configWriter.createFromTemplate(bot, botTemplate)
    await this.mountBot(bot.id)
    this._invalidateBotIds()
  }

  async updateBot(botId: string, bot: Bot): Promise<void> {
    this.stats.track('ce', 'updateBot')

    const { error } = Joi.validate(bot, BotEditSchema)
    if (error) {
      throw new InvalidOperationError(`An error occurred while updating the bot: ${error.message}`)
    }

    const actualBot = await this.configProvider.getBotConfig(botId)
    actualBot.name = bot.name
    actualBot.description = bot.description
    await this.configProvider.setBotConfig(botId, actualBot)
  }

  async deleteBot(botId: string) {
    await this.unmountBot(botId)
    await this.ghostService.forBot(botId).deleteFolder('/')
    this._invalidateBotIds()
  }

  private async _mountBot(botId: string) {
    const bot = await this.getBotById(botId)

    await this.ghostService.forBot(bot.id).sync(['actions', 'content-elements', 'flows', 'intents'])
    await this.cms.loadContentElementsForBot(bot.id)
    await this.moduleLoader.loadModulesForBot(bot.id)

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotMount(api, bot.id))
  }

  private async _unmountBot(botId: string) {
    await this.cms.unloadContentElementsForBot(botId)
    this.moduleLoader.unloadModulesForBot(botId)

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotUnmount(api, botId))
  }

  private _invalidateBotIds(): void {
    this._botIds = undefined
  }
}
