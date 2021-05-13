import { BotConfig, Logger } from 'botpress/sdk'
import { BotEditSchema } from 'common/validation'
import { TYPES } from 'core/app/types'
import { GhostService, ReplaceContent } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { ConfigProvider } from 'core/config'
import { JobService } from 'core/distributed/job-service'
import { InvalidOperationError } from 'core/routers'
import { WrapErrorsWith } from 'errors'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'
import path from 'path'

const BOT_CONFIG_FILENAME = 'bot.config.json'
const BOT_ID_PLACEHOLDER = '/bots/BOT_ID_PLACEHOLDER/'

const debug = DEBUG('services:bots')

@injectable()
export class BotService {
  public mountBot: Function = this.localMount
  public unmountBot: Function = this.localUnmount

  private _botIds: string[] | undefined
  private static _mountedBots: Map<string, boolean> = new Map()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotService')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    this._botIds = undefined
  }

  @postConstruct()
  async init() {
    this.mountBot = await this.jobService.broadcast<void>(this.localMount.bind(this))
    this.unmountBot = await this.jobService.broadcast<void>(this.localUnmount.bind(this))
  }

  async findBotById(botId: string): Promise<BotConfig | undefined> {
    if (!(await this.ghostService.forBot(botId).fileExists('/', 'bot.config.json'))) {
      this.logger.forBot(botId).warn(`Bot "${botId}" not found. Make sure it exists on your filesystem or database.`)
      return
    }

    return this.configProvider.getBotConfig(botId)
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
        this.logger
          .forBot(botId)
          .attachError(err)
          .error(`Bot configuration file not found for bot "${botId}"`)
      }
    }

    return bots
  }

  async getBotsIds(ignoreCache?: boolean): Promise<string[]> {
    if (!this._botIds || ignoreCache) {
      this._botIds = (await this.ghostService.bots().directoryListing('/', BOT_CONFIG_FILENAME)).map(path.dirname)
    }

    return this._botIds
  }

  async updateBot(botId: string, updatedBot: Partial<BotConfig>): Promise<void> {
    const { error } = Joi.validate(updatedBot, BotEditSchema)
    if (error) {
      throw new InvalidOperationError(`An error occurred while updating the bot: ${error.message}`)
    }

    if (!(await this.botExists(botId))) {
      throw new Error(`Bot "${botId}" doesn't exist`)
    }

    if (!process.IS_PRO_ENABLED && updatedBot.languages && updatedBot.languages.length > 1) {
      throw new Error('A single language is allowed on community edition.')
    }

    const actualBot = await this.configProvider.getBotConfig(botId)
    const updatedFields = _.pick(updatedBot, [
      'name',
      'description',
      'category',
      'details',
      'disabled',
      'private',
      'defaultLanguage',
      'languages',
      'locked'
    ]) as Partial<BotConfig>

    // bot needs to be mounted to perform the language changes
    if (updatedFields.defaultLanguage && updatedFields.defaultLanguage !== actualBot.defaultLanguage) {
      updatedFields.disabled = false
    }

    const newConfig = {
      ...actualBot,
      ...updatedFields
    } as BotConfig

    if (!newConfig.languages.includes(newConfig.defaultLanguage)) {
      throw new Error('Supported languages must include the default language of the bot')
    }

    await this.configProvider.setBotConfig(botId, newConfig)

    if (!updatedBot.disabled) {
      if (this.isBotMounted(botId)) {
        // we need to remount the bot to update the config
        await this.unmountBot(botId)
      }

      await this.mountBot(botId)
    }

    if (actualBot.defaultLanguage !== updatedBot.defaultLanguage) {
      await this.cms.translateContentProps(botId, actualBot.defaultLanguage, updatedBot.defaultLanguage!)
    }

    // This will regenerate previews for all the bot's languages
    if (actualBot.languages !== updatedBot.languages) {
      await this.cms.recomputeElementsForBot(botId)
    }

    if (!actualBot.disabled && updatedBot.disabled) {
      await this.unmountBot(botId)
    }
  }

  async exportBot(botId: string): Promise<Buffer> {
    const replaceContent: ReplaceContent = {
      from: [new RegExp(`/bots/${botId}/`, 'g')],
      to: [BOT_ID_PLACEHOLDER]
    }

    return this.ghostService.forBot(botId).exportToArchiveBuffer('models/**/*', replaceContent)
  }

  async duplicateBot(sourceBotId: string, destBotId: string, overwriteDest: boolean = false) {
    if (!(await this.botExists(sourceBotId))) {
      throw new Error('Source bot does not exist')
    }
    if (sourceBotId === destBotId) {
      throw new Error('New bot id needs to differ from original bot')
    }
    if (!overwriteDest && (await this.botExists(destBotId))) {
      this.logger
        .forBot(destBotId)
        .warn('Tried to duplicate a bot to existing destination id without allowing to overwrite')
      return
    }

    const sourceGhost = this.ghostService.forBot(sourceBotId)
    const destGhost = this.ghostService.forBot(destBotId)
    const botContent = await sourceGhost.directoryListing('/')
    await Promise.all(
      botContent.map(async file => destGhost.upsertFile('/', file, await sourceGhost.readFileAsBuffer('/', file)))
    )
    // const workspaceId = await this.workspaceService.getBotWorkspaceId(sourceBotId)
    // await this.workspaceService.addBotRef(destBotId, workspaceId)
    await this.mountBot(destBotId)
  }

  public async botExists(botId: string, ignoreCache?: boolean): Promise<boolean> {
    return (await this.getBotsIds(ignoreCache)).includes(botId)
  }

  @WrapErrorsWith(args => `Could not delete bot '${args[0]}'`, { hideStackTrace: true })
  async deleteBot(botId: string) {
    if (!(await this.botExists(botId))) {
      throw new Error(`Bot "${botId}" doesn't exist`)
    }

    await this.unmountBot(botId)
    await this.ghostService.forBot(botId).deleteFolder('/')
    this._invalidateBotIds()
  }

  public isBotMounted(botId: string): boolean {
    return BotService._mountedBots.get(botId) || false
  }

  async localMount(botId: string): Promise<boolean> {
    const startTime = Date.now()
    if (this.isBotMounted(botId)) {
      return true
    }

    if (!(await this.ghostService.forBot(botId).fileExists('/', 'bot.config.json'))) {
      this.logger
        .forBot(botId)
        .error(`Cannot mount bot "${botId}". Make sure it exists on the filesystem or the database.`)
      return false
    }

    try {
      const config = await this.configProvider.getBotConfig(botId)
      if (!config.languages.includes(config.defaultLanguage)) {
        throw new Error('Supported languages must include the default language of the bot')
      }

      await this.cms.loadElementsForBot(botId)

      BotService._mountedBots.set(botId, true)
      this._invalidateBotIds()

      return true
    } catch (err) {
      this.logger
        .forBot(botId)
        .attachError(err)
        .critical(`Cannot mount bot "${botId}"`)

      return false
    } finally {
      debug.forBot(botId, `Mount took ${Date.now() - startTime}ms`)
    }
  }

  async localUnmount(botId: string) {
    const startTime = Date.now()
    if (!this.isBotMounted(botId)) {
      this._invalidateBotIds()
      return
    }

    await this.cms.clearElementsFromCache(botId)

    BotService._mountedBots.set(botId, false)

    this._invalidateBotIds()
    debug.forBot(botId, `Unmount took ${Date.now() - startTime}ms`)
  }

  private _invalidateBotIds(): void {
    this._botIds = undefined
  }

  public static getMountedBots() {
    const bots: string[] = []
    BotService._mountedBots.forEach((isMounted, bot) => isMounted && bots.push(bot))
    return bots
  }
}
