import { BotTemplate, Logger } from 'botpress/sdk'
import { Bot } from 'core/misc/interfaces'
import { listDir } from 'core/misc/list-dir'
import { FileContent, GhostService } from 'core/services'
import { ModuleResourceLoader } from 'core/services/module/resources-loader'
import { TYPES } from 'core/types'
import fse from 'fs-extra'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import path from 'path'
import { VError } from 'verror'

import { BOT_DIRECTORIES, BotConfig } from './bot.config'

@injectable()
export class BotConfigWriter {
  private BOT_CONFIG_FILENAME = 'bot.config.json'

  constructor(@inject(TYPES.Logger) private logger: Logger, @inject(TYPES.GhostService) private ghost: GhostService) {}

  async createFromTemplate(bot: Bot, template: BotTemplate) {
    const resourceLoader = new ModuleResourceLoader(this.logger, template.moduleId!, this.ghost)
    const templatePath = await resourceLoader.getBotTemplatePath(template.id)
    const templateConfig = path.resolve(templatePath, this.BOT_CONFIG_FILENAME)
    const botDestinationPath = path.join(process.PROJECT_LOCATION, `data/bots/${bot.id}/`)

    try {
      const startsWithADot = /^\./gm
      const templateFiles = listDir(templatePath, [startsWithADot])
      const scopedGhost = this.ghost.forBot(bot.id)
      const files = templateFiles.map(f => {
        return {
          name: f.relativePath,
          content: fse.readFileSync(f.absolutePath)
        } as FileContent
      })

      await scopedGhost.upsertFiles('/', files)

      if (fse.existsSync(templateConfig)) {
        this._writeTemplateConfig(templateConfig, bot)
        await scopedGhost.ensureDirs('/', BOT_DIRECTORIES)
      } else {
        throw new Error("Bot template doesn't exist")
      }
    } catch (err) {
      throw new VError(err, `Error writing file "${botDestinationPath}"`)
    }
  }

  private async _writeTemplateConfig(configFile: string, bot: Bot) {
    try {
      const templateConfig = JSON.parse(await fse.readFileSync(configFile, 'utf-8'))
      this._writeConfig(bot.id, { ...templateConfig, id: bot.id, name: bot.name })
    } catch (e) {
      throw new VError(e, `Error writing configuration file from "${configFile}"`)
    }
  }

  private async _writeConfig(botId: string, config: BotConfig) {
    const fileName = 'bot.config.json'
    const scopedGhost = this.ghost.forBot(botId)
    const content = JSON.stringify(config, undefined, 2)
    await scopedGhost.upsertFile('/', fileName, content)
  }

  async deleteBot(botId: string) {
    const scopedGhost = this.ghost.forBot(botId)
    await scopedGhost.deleteFolder('/')
  }
}
