import fse from 'fs-extra'
import { injectable } from 'inversify'
import path from 'path'
import { VError } from 'verror'

import { BotConfig } from './bot.config'

@injectable()
export class BotConfigWriter {
  async writeToFile(config: BotConfig) {
    const filePath = this.getBotFilePath(config.id)
    const templatePath = path.join(process.PROJECT_LOCATION, './templates/bot-template/')
    const fileName = 'bot.config.json'

    try {
      await fse.ensureDir(filePath)
      await fse.copySync(templatePath, filePath)
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
