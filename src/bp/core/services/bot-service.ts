import { BotConfig, BotTemplate, Logger } from 'botpress/sdk'
import { BotCreationSchema, BotEditSchema } from 'common/validation'
import { createForGlobalHooks } from 'core/api'
import { BotConfigWriter } from 'core/config'
import { ConfigProvider } from 'core/config/config-loader'
import { Bot } from 'core/misc/interfaces'
import { ModuleLoader } from 'core/module-loader'
import { Statistics } from 'core/stats'
import { TYPES } from 'core/types'
import { WrapErrorsWith } from 'errors'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'
import path from 'path'

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
  private static _mountedBots: Map<string, boolean> = new Map()

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

  async findBotById(botId: string): Promise<BotConfig | undefined> {
    const bot = await this.configProvider.getBotConfig(botId)
    !bot && this.logger.warn(`Bot "${botId}" not found. Make sure it exists on your filesystem or database.`)

    return bot
  }

  async findBotsByIds(botsIds: string[]): Promise<BotConfig[]> {
    const actualBotsIds = await this.getBotsIds()
    const unlinkedBots = _.difference(actualBotsIds, botsIds)
    const linkedBots = _.without(actualBotsIds, ...unlinkedBots)
    const botConfigs: BotConfig[] = []

    for (const botId of linkedBots) {
      const config = await this.findBotById(botId)
      config && botConfigs.push(config)
    }

    return botConfigs
  }

  async getBots(): Promise<Map<string, BotConfig>> {
    const botIds = await this.getBotsIds()
    const bots = new Map<string, BotConfig>()

    for (const botId of botIds) {
      try {
        const bot = await this.findBotById(botId)
        bot && bots.set(botId, bot)
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
    return (this._botIds = _.map(bots, x => path.dirname(x)))
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

  @WrapErrorsWith(args => `Could not delete bot '${args[0]}'`, { hideStackTrace: true })
  async deleteBot(botId: string) {
    await this.unmountBot(botId)
    await this.ghostService.forBot(botId).deleteFolder('/')
    this._invalidateBotIds()
  }

  private isBotMounted(botId: string): boolean {
    return BotService._mountedBots.get(botId) || false
  }

  private async _mountBot(botId: string) {
    if (this.isBotMounted(botId)) {
      return
    }

    try {
      await this.ghostService.forBot(botId).sync()

      await this.cms.loadContentElementsForBot(botId)
      await this.moduleLoader.loadModulesForBot(botId)

      const api = await createForGlobalHooks()
      await this.hookService.executeHook(new Hooks.AfterBotMount(api, botId))
      BotService._mountedBots.set(botId, true)
      this._invalidateBotIds()
    } catch (err) {
      this.logger
        .attachError(err)
        .error(`Cannot mount bot "${botId}". Make sure it exists on the filesytem or the database.`)
    }
  }

  private async _unmountBot(botId: string) {
    if (!this.isBotMounted(botId)) {
      return
    }

    await this.cms.unloadContentElementsForBot(botId)
    this.moduleLoader.unloadModulesForBot(botId)

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotUnmount(api, botId))
    BotService._mountedBots.set(botId, false)
    this._invalidateBotIds()
  }

  private _invalidateBotIds(): void {
    this._botIds = undefined
  }
}
