import { BotTemplate, Logger } from 'botpress/sdk'
import { Bot } from 'core/misc/interfaces'
import { CMSService } from 'core/services/cms'
import { FlowService } from 'core/services/dialog/flow/service'
import { ModuleResourceLoader } from 'core/services/module/resources-loader'
import { TYPES } from 'core/types'
import fse from 'fs-extra'
import { inject, injectable } from 'inversify'
import defaultJsonBuilder from 'json-schema-defaults'
import _ from 'lodash'
import path from 'path'
import { VError } from 'verror'

import { BotConfig } from './bot.config'

@injectable()
export class BotConfigWriter {
  private BOT_CONFIG_FILENAME = 'bot.config.json'
  private BOT_SCHEMA_FILENAME = 'bot.config.schema.json'

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.FlowService) private flowService: FlowService
  ) {}

  async createFromTemplate(bot: Bot, template: BotTemplate) {
    const resourceLoader = new ModuleResourceLoader(this.logger, template.moduleId!)
    const templatePath = await resourceLoader.getBotTemplatePath(template.id)
    const templateConfig = path.resolve(templatePath, this.BOT_CONFIG_FILENAME)
    const botDestinationPath = this.getBotFilePath(bot.id)

    try {
      await fse.ensureDir(botDestinationPath)
      await fse.copySync(templatePath, botDestinationPath)

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
      this._writeToFile({ ...templateConfig, id: bot.id, name: bot.name })
    } catch (e) {
      throw new VError(e, `Error writing configuration file from "${configFile}"`)
    }
  }

  private async _writeDefaultConfig(bot: Bot) {
    try {
      const botConfigSchema = path.resolve(process.PROJECT_LOCATION, 'data', this.BOT_SCHEMA_FILENAME)
      const defaultConfig = defaultJsonBuilder(JSON.parse(fse.readFileSync(botConfigSchema, 'utf-8')))
      const contentTypes = await this.cms.getAllContentTypes()

      await this._writeToFile({
        $schema: `../../${this.BOT_SCHEMA_FILENAME}`,
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

  private async _writeToFile(config: BotConfig) {
    const filePath = this.getBotFilePath(config.id)
    const fileName = 'bot.config.json'

    try {
      await fse.ensureDir(filePath)
      await fse.writeFile(filePath + fileName, JSON.stringify(config, undefined, 2))
    } catch (e) {
      throw new VError(e, `Error writing file "${filePath}"`)
    }
  }

  async deleteBotFolder(botId: string) {
    const filePath = this.getBotFilePath(botId)

    try {
      await fse.remove(filePath)
    } catch (err) {
      throw new VError(err, `Error while deleting file at "${filePath}"`)
    }
  }

  private getBotFilePath(botId: string) {
    return path.join(process.PROJECT_LOCATION, `./data/bots/${botId}/`)
  }
}
