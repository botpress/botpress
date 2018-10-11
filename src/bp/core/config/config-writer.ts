import { TYPES } from 'core/types'
import fse from 'fs-extra'
import { inject, injectable } from 'inversify'
import path from 'path'
import { VError } from 'verror'

import { BotConfig } from './bot.config'

@injectable()
export class BotConfigWriter {
  constructor(@inject(TYPES.ProjectLocation) private projectLocation: string) {}

  async writeToFile(config: BotConfig) {
    const filePath = path.join(this.projectLocation, `./data/bots/${config.id}/`)
    const templatePath = path.join(this.projectLocation, '../templates/bot-template/')
    const fileName = 'bot.config.json'

    try {
      await fse.ensureDir(filePath)
      await fse.copySync(templatePath, filePath)
      await fse.writeFile(filePath + fileName, JSON.stringify(config, undefined, 2))
    } catch (e) {
      throw new VError(e, `Error writing file "${filePath}"`)
    }
  }
}
