import { BotConfig, BotTemplate, Logger, Stage } from 'botpress/sdk'
import { BotCreationSchema, BotEditSchema } from 'common/validation'
import { createForGlobalHooks } from 'core/api'
import { ConfigProvider } from 'core/config/config-loader'
import { listDir } from 'core/misc/list-dir'
import { ModuleLoader } from 'core/module-loader'
import { Statistics } from 'core/stats'
import { TYPES } from 'core/types'
import { WrapErrorsWith } from 'errors'
import fse from 'fs-extra'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'
import moment from 'moment'
import path from 'path'
import tmp from 'tmp'
import { VError } from 'verror'

import { extractArchive } from '../misc/archive'

import { InvalidOperationError } from './auth/errors'
import { CMSService } from './cms'
import { FileContent, GhostService } from './ghost/service'
import { Hooks, HookService } from './hook/hook-service'
import { JobService } from './job-service'
import { ModuleResourceLoader } from './module/resources-loader'
import { WorkspaceService } from './workspace-service'

const BOT_DIRECTORIES = ['actions', 'flows', 'entities', 'content-elements', 'intents', 'qna']
const BOT_CONFIG_FILENAME = 'bot.config.json'
const REVISIONS_DIR = './revisions'
const REV_SPLIT_CHAR = '++'
const MAX_REV = 10
const DEFAULT_BOT_CONFIGS = {
  locked: false,
  disabled: false,
  private: false,
  details: {}
}

@injectable()
export class BotService {
  public mountBot: Function = this._localMount
  public unmountBot: Function = this._localUnmount

  private _botIds: string[] | undefined
  private static _mountedBots: Map<string, boolean> = new Map()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotService')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.Statistics) private stats: Statistics,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService
  ) {
    this._botIds = undefined
  }

  @postConstruct()
  async init() {
    this.mountBot = await this.jobService.broadcast<void>(this._localMount.bind(this))
    this.unmountBot = await this.jobService.broadcast<void>(this._localUnmount.bind(this))
  }

  async findBotById(botId: string): Promise<BotConfig | undefined> {
    const bot = await this.configProvider.getBotConfig(botId)
    !bot && this.logger.warn(`Bot "${botId}" not found. Make sure it exists on your filesystem or database.`)

    // @deprecated > 11 : New bots all define default language
    if (!bot.defaultLanguage) {
      bot.disabled = true
    }

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

    const bots = await this.ghostService.bots().directoryListing('/', BOT_CONFIG_FILENAME)
    return (this._botIds = _.map(bots, x => path.dirname(x)))
  }

  async addBot(bot: BotConfig, botTemplate: BotTemplate): Promise<void> {
    this.stats.track('bot', 'create')

    const { error } = Joi.validate(bot, BotCreationSchema)
    if (error) {
      throw new InvalidOperationError(`An error occurred while creating the bot: ${error.message}`)
    }

    const mergedConfigs = await this._createBotFromTemplate(bot, botTemplate)
    if (mergedConfigs) {
      if (!mergedConfigs.disabled) {
        await this.mountBot(bot.id)
        await this.cms.translateContentProps(bot.id, undefined, mergedConfigs.defaultLanguage)
      }
      this._invalidateBotIds()
    }
  }

  async updateBot(botId: string, updatedBot: Partial<BotConfig>): Promise<void> {
    this.stats.track('bot', 'update')

    const { error } = Joi.validate(updatedBot, BotEditSchema)
    if (error) {
      throw new InvalidOperationError(`An error occurred while updating the bot: ${error.message}`)
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
    updatedFields.disabled = updatedFields.disabled && actualBot.defaultLanguage == updatedFields.defaultLanguage

    await this.configProvider.setBotConfig(botId, {
      ...actualBot,
      ...updatedFields
    })

    if (actualBot.disabled && !updatedBot.disabled) {
      await this.mountBot(botId)
    }

    if (actualBot.defaultLanguage !== updatedBot.defaultLanguage) {
      await this.cms.translateContentProps(botId, actualBot.defaultLanguage, updatedBot.defaultLanguage)
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
    return this.ghostService.forBot(botId).exportToArchiveBuffer('models/*')
  }

  async importBot(botId: string, archive: Buffer, allowOverwrite?: boolean): Promise<void> {
    if (await this.botExists(botId)) {
      if (!allowOverwrite) {
        return this.logger.error(`Cannot import the bot ${botId}, it already exists, and overwrite is not allowed`)
      } else {
        this.logger.warn(`The bot ${botId} already exists, files in the archive will overwrite existing ones`)
      }
    }
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    const tmpFolder = tmpDir.name

    try {
      await extractArchive(archive, tmpFolder)
      const api = await createForGlobalHooks()

      const hookResult = {
        allowImport: true
      }

      await this.hookService.executeHook(new Hooks.BeforeBotImport(api, botId, tmpFolder, hookResult))

      if (hookResult.allowImport) {
        await this.ghostService.forBot(botId).importFromDirectory(tmpDir.name)
        const newConfigs = <Partial<BotConfig>>{
          id: botId,
          pipeline_status: {
            current_stage: {
              id: (await this.workspaceService.getPipeline())[0].id,
              promoted_by: 'system',
              promoted_on: new Date()
            }
          }
        }
        if (await this.botExists(botId)) {
          await this.unmountBot(botId)
        }
        await this.configProvider.mergeBotConfig(botId, newConfigs)
        await this.mountBot(botId)
        this.logger.info(`Import of bot ${botId} successful`)
      } else {
        this.logger.info(`Import of bot ${botId} was denied by hook validation`)
      }
    } finally {
      tmpDir.removeCallback()
    }
  }

  async requestStageChange(botId: string, requested_by: string) {
    const botConfig = (await this.findBotById(botId)) as BotConfig
    if (!botConfig) {
      throw Error('bot does not exist')
    }
    const pipeline = await this.workspaceService.getPipeline()
    const nextStageIdx = pipeline.findIndex(s => s.id === botConfig.pipeline_status.current_stage.id) + 1
    if (nextStageIdx >= pipeline.length) {
      this.logger.debug('end of pipeline')
      return
    }

    const stage_request = {
      id: pipeline[nextStageIdx].id,
      status: 'pending',
      requested_on: new Date(),
      requested_by
    }

    const newConfig = await this.configProvider.mergeBotConfig(botId, { pipeline_status: { stage_request } })
    await this._executeStageChangeHooks(botConfig, newConfig)
  }

  async duplicateBot(sourceBotId: string, destBotId: string, overwriteDest: boolean = false) {
    if (!(await this.botExists(sourceBotId))) {
      throw new Error('Source bot does not exist')
    }
    if (sourceBotId === destBotId) {
      throw new Error('New bot id needs to differ from original bot')
    }
    if (!overwriteDest && (await this.botExists(destBotId))) {
      this.logger.warn('Tried to duplicate a bot to existing destination id without allowing to overwrite')
      return
    }

    const sourceGhost = this.ghostService.forBot(sourceBotId)
    const destGhost = this.ghostService.forBot(destBotId)
    const botContent = await sourceGhost.directoryListing('/')
    await Promise.all(
      botContent.map(async file => destGhost.upsertFile('/', file, await sourceGhost.readFileAsBuffer('/', file)))
    )

    await this.workspaceService.addBotRef(destBotId)
    await this.mountBot(destBotId)
  }

  private async botExists(botId: string): Promise<boolean> {
    return (await this.getBotsIds()).includes(botId)
  }

  private async _executeStageChangeHooks(beforeRequestConfig: BotConfig, currentConfig: BotConfig) {
    const bpConfig = await this.configProvider.getBotpressConfig()
    const alteredBot = _.cloneDeep(currentConfig)
    const users = await this.workspaceService.listUsers(['email', 'role'])
    const pipeline = await this.workspaceService.getPipeline()
    const api = await createForGlobalHooks()
    const currentStage = <Stage>pipeline.find(s => s.id === currentConfig.pipeline_status.current_stage.id)
    const hookResult = {
      actions: [currentStage.action]
    }

    await this.hookService.executeHook(new Hooks.OnStageChangeRequest(api, alteredBot, users, pipeline, hookResult))
    if (_.isArray(hookResult.actions)) {
      await Promise.map(hookResult.actions, async action => {
        if (bpConfig.autoRevision) {
          await this.createRevision(alteredBot.id)
        }
        if (action === 'promote_copy') {
          return this._promoteCopy(currentConfig, alteredBot)
        } else if (action === 'promote_move') {
          return this._promoteMove(alteredBot)
        }
      })
    }
    // stage has changed
    if (currentConfig.pipeline_status.current_stage.id !== alteredBot.pipeline_status.current_stage.id) {
      await this.hookService.executeHook(
        new Hooks.AfterStageChanged(api, beforeRequestConfig, alteredBot, users, pipeline)
      )
      if (bpConfig.autoRevision) {
        await this.createRevision(alteredBot.id)
      }
    }
  }

  private async _promoteMove(bot: BotConfig) {
    bot.pipeline_status.current_stage = {
      id: bot.pipeline_status.stage_request!.id,
      promoted_by: bot.pipeline_status.stage_request!.requested_by,
      promoted_on: new Date()
    }
    delete bot.pipeline_status.stage_request
    return this.configProvider.setBotConfig(bot.id, bot)
  }

  private async _promoteCopy(initialBot: BotConfig, newBot: BotConfig) {
    if (initialBot.id == newBot.id) {
      newBot.id = `${newBot.id}__${moment().format('YY-MM-DD')}__${Math.round(Math.random() * 100)}`
    }

    newBot.pipeline_status.current_stage = {
      id: newBot.pipeline_status.stage_request!.id,
      promoted_by: newBot.pipeline_status.stage_request!.requested_by,
      promoted_on: new Date()
    }
    delete newBot.pipeline_status.stage_request

    try {
      await this.duplicateBot(initialBot.id, newBot.id, true)
      await this.configProvider.setBotConfig(newBot.id, newBot)

      delete initialBot.pipeline_status.stage_request
      return this.configProvider.setBotConfig(initialBot.id, initialBot)
    } catch (err) {
      this.logger.attachError(err).error(`Error trying to "promote_copy" bot : ${initialBot.id}`)
    }
  }

  @WrapErrorsWith(args => `Could not delete bot '${args[0]}'`, { hideStackTrace: true })
  async deleteBot(botId: string) {
    this.stats.track('bot', 'delete')

    await this.unmountBot(botId)
    await this._cleanupRevisions(botId, true)
    await this.ghostService.forBot(botId).deleteFolder('/')
    this._invalidateBotIds()
  }

  private async _createBotFromTemplate(botConfig: BotConfig, template: BotTemplate): Promise<BotConfig | undefined> {
    const resourceLoader = new ModuleResourceLoader(this.logger, template.moduleId!, this.ghostService)
    const templatePath = await resourceLoader.getBotTemplatePath(template.id)
    const templateConfigPath = path.resolve(templatePath, BOT_CONFIG_FILENAME)

    try {
      const scopedGhost = this.ghostService.forBot(botConfig.id)
      const files = this._loadBotTemplateFiles(templatePath)
      if (fse.existsSync(templateConfigPath)) {
        const templateConfig = JSON.parse(await fse.readFileSync(templateConfigPath, 'utf-8'))
        const mergedConfigs = {
          ...DEFAULT_BOT_CONFIGS,
          ...templateConfig,
          ...botConfig
        }

        if (!mergedConfigs.imports.contentTypes) {
          const allContentTypes = await this.cms.getAllContentTypes()
          mergedConfigs.imports.contentTypes = allContentTypes.map(x => x.id)
        }

        if (!mergedConfigs.defaultLanguage) {
          mergedConfigs.disabled = true
        }

        await scopedGhost.ensureDirs('/', BOT_DIRECTORIES)
        await scopedGhost.upsertFile('/', BOT_CONFIG_FILENAME, JSON.stringify(mergedConfigs, undefined, 2))
        await scopedGhost.upsertFiles('/', files)

        return mergedConfigs
      } else {
        throw new Error("Bot template doesn't exist")
      }
    } catch (err) {
      this.logger.attachError(err).error(`Error creating bot ${botConfig.id} from template "${template.name}"`)
    }
  }

  private _loadBotTemplateFiles(templatePath: string): FileContent[] {
    const startsWithADot = /^\./gm
    const templateFiles = listDir(templatePath, [startsWithADot, new RegExp(BOT_CONFIG_FILENAME)])
    return templateFiles.map(
      f =>
        <FileContent>{
          name: f.relativePath,
          content: fse.readFileSync(f.absolutePath)
        }
    )
  }

  private _isBotMounted(botId: string): boolean {
    return BotService._mountedBots.get(botId) || false
  }

  // Do not use directly use the public version instead due to broadcasting
  private async _localMount(botId: string) {
    if (this._isBotMounted(botId)) {
      return
    }

    try {
      await this.ghostService.forBot(botId).sync()

      await this.cms.loadElementsForBot(botId)
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

  // Do not use directly use the public version instead due to broadcasting
  private async _localUnmount(botId: string) {
    if (!this._isBotMounted(botId)) {
      return
    }

    await this.cms.clearElementsFromCache(botId)
    await this.moduleLoader.unloadModulesForBot(botId)

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotUnmount(api, botId))
    BotService._mountedBots.set(botId, false)
    this._invalidateBotIds()
  }

  private _invalidateBotIds(): void {
    this._botIds = undefined
  }

  public static getMountedBots() {
    const bots: string[] = []
    BotService._mountedBots.forEach((isMounted, bot) => isMounted && bots.push(bot))
    return bots
  }

  public async listRevisions(botId: string): Promise<string[]> {
    const globalGhost = this.ghostService.global()

    let stageID = ''
    if (await this.workspaceService.hasPipeline()) {
      const botConfig = await this.configProvider.getBotConfig(botId)
      stageID = botConfig.pipeline_status.current_stage.id
    }

    const revisions = await globalGhost.directoryListing(REVISIONS_DIR, '*.tgz')
    return revisions
      .filter(rev => rev.startsWith(`${botId}${REV_SPLIT_CHAR}`) && rev.includes(stageID))
      .sort((revA, revB) => {
        const dateA = revA.split(REV_SPLIT_CHAR)[1].replace('.tgz', '')
        const dateB = revB.split(REV_SPLIT_CHAR)[1].replace('.tgz', '')

        return parseInt(dateA, 10) - parseInt(dateB, 10)
      })
  }

  public async createRevision(botId: string): Promise<void> {
    let revName = botId + REV_SPLIT_CHAR + Date.now()

    if (await this.workspaceService.hasPipeline()) {
      const botConfig = await this.configProvider.getBotConfig(botId)
      revName = revName + REV_SPLIT_CHAR + botConfig.pipeline_status.current_stage.id
    }

    const botGhost = this.ghostService.forBot(botId)
    const globalGhost = this.ghostService.global()
    await globalGhost.upsertFile(REVISIONS_DIR, `${revName}.tgz`, await botGhost.exportToArchiveBuffer('models/*'))
    return this._cleanupRevisions(botId)
  }

  public async rollback(botId: string, revision: string): Promise<void> {
    const revParts = revision.replace('.tgz', '').split(REV_SPLIT_CHAR)
    if (revParts.length < 2) {
      throw new VError('invalid revision')
    }

    if (revParts[0] !== botId) {
      throw new VError('cannot rollback a bot with a different Id')
    }

    if (await this.workspaceService.hasPipeline()) {
      const botConfig = await this.configProvider.getBotConfig(botId)
      if (revParts.length < 3 || revParts[2] != botConfig.pipeline_status.current_stage.id) {
        throw new VError('cannot rollback a bot to a different stage')
      }
    }

    const revArchive = await this.ghostService.global().readFileAsBuffer(REVISIONS_DIR, revision)
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    const tmpFolder = tmpDir.name

    try {
      await extractArchive(revArchive, tmpFolder)
      await this.unmountBot(botId)
      await this.ghostService.forBot(botId).deleteFolder('/')
      await this.ghostService.forBot(botId).importFromDirectory(tmpDir.name)
      await this.mountBot(botId)
      this.logger.info(`Rollback of bot ${botId} successful`)
    } finally {
      tmpDir.removeCallback()
    }
  }

  private async _cleanupRevisions(botId: string, cleanAll: boolean = false): Promise<void> {
    const revs = await this.listRevisions(botId)
    const outDated = revs.filter((_, i) => cleanAll || i > MAX_REV)

    const globalGhost = this.ghostService.global()
    await Promise.mapSeries(outDated, rev => globalGhost.deleteFile(REVISIONS_DIR, rev))
  }
}
