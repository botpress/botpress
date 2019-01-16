import { BotTemplate, Logger } from 'botpress/sdk'
import { Bot } from 'core/misc/interfaces'
import { FileContent, GhostService } from 'core/services'
import { CMSService } from 'core/services/cms'
import { FlowService } from 'core/services/dialog/flow/service'
import { ModuleResourceLoader } from 'core/services/module/resources-loader'
import { TYPES } from 'core/types'
import fs from 'fs'
import fse from 'fs-extra'
import { inject, injectable } from 'inversify'
import defaultJsonBuilder from 'json-schema-defaults'
import _ from 'lodash'
import path from 'path'
import { VError } from 'verror'

import { BotConfig } from './bot.config'

type FileListing = { relativePath: string; absolutePath: string }

@injectable()
export class BotConfigWriter {
  private BOT_CONFIG_FILENAME = 'bot.config.json'
  private BOT_SCHEMA_FILENAME = 'bot.config.schema.json'

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.FlowService) private flowService: FlowService
  ) {}

  async createFromTemplate(bot: Bot, template: BotTemplate) {
    const resourceLoader = new ModuleResourceLoader(this.logger, template.moduleId!)
    const templatePath = await resourceLoader.getBotTemplatePath(template.id)
    const templateConfig = path.resolve(templatePath, this.BOT_CONFIG_FILENAME)
    const botDestinationPath = path.join(process.PROJECT_LOCATION, `data/bots/${bot.id}/`)

    try {
      await fse.ensureDir(botDestinationPath)

      const startsWithADot = /^\./gm
      const templateFiles = this._listDir(templatePath, [startsWithADot])
      const scopedGhost = this.ghost.forBot(bot.id)
      const files = templateFiles.map(f => {
        return {
          name: f.relativePath,
          content: fse.readFileSync(f.absolutePath)
        } as FileContent
      })

      await scopedGhost.upsertFiles('/', files)

      fse.existsSync(templateConfig) ? this._writeTemplateConfig(templateConfig, bot) : this._writeDefaultConfig(bot)
    } catch (e) {
      throw new VError(e, `Error writing file "${botDestinationPath}"`)
    }
  }

  async createEmptyBot(bot: Bot) {
    await this._writeDefaultConfig(bot)
    await this.flowService.createMainFlow(bot.id)
  }

  private async _writeTemplateConfig(configFile: string, bot: Bot) {
    try {
      const templateConfig = JSON.parse(await fse.readFileSync(configFile, 'utf-8'))
      this._writeConfig(bot.id, { ...templateConfig, id: bot.id, name: bot.name })
    } catch (e) {
      throw new VError(e, `Error writing configuration file from "${configFile}"`)
    }
  }

  private async _writeDefaultConfig(bot: Bot) {
    try {
      const botConfigSchema = path.resolve(process.PROJECT_LOCATION, 'data', this.BOT_SCHEMA_FILENAME)
      const defaultConfig = defaultJsonBuilder(JSON.parse(fse.readFileSync(botConfigSchema, 'utf-8')))
      const contentTypes = await this.cms.getAllContentTypes()

      await this._writeConfig(bot.id, {
        $schema: `../${this.BOT_SCHEMA_FILENAME}`,
        id: bot.id,
        name: bot.name,
        ...defaultConfig,
        imports: {
          contentTypes: contentTypes && contentTypes.map(x => x.id)
        }
      })
    } catch (e) {
      throw new VError(e, `Error writing default configuration file for "${bot.name}"`)
    }
  }

  private async _writeConfig(botId: string, config: BotConfig) {
    const fileName = 'bot.config.json'
    const scopedGhost = this.ghost.forBot(botId)
    await scopedGhost.upsertFile('/', fileName, JSON.stringify(config, undefined, 2))
  }

  async deleteBotFolder(botId: string) {
    const scopedGhost = this.ghost.forBot(botId)
    await scopedGhost.deleteFile('/', 'bot.config.json')
  }

  private _listDir(
    dirPath: string,
    ignores: RegExp[] = [],
    files: FileListing[] = [],
    rootPath = dirPath
  ): FileListing[] {
    let filesNames = fs.readdirSync(dirPath)

    filesNames = filesNames.filter(x => {
      const match = ignores.filter(i => x.match(i))
      return match && !match.length
    })

    for (const fileName of filesNames) {
      const filePath = path.join(dirPath, fileName)
      const fileStats = fs.statSync(filePath)

      if (fileStats.isDirectory()) {
        files = this._listDir(filePath, ignores, files, rootPath)
      } else {
        // We keep the files paths relative to the dir root
        files.push({ relativePath: path.relative(rootPath, filePath), absolutePath: filePath })
      }
    }

    return files
  }
}
