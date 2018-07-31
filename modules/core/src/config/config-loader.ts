import fs from 'fs'
import { inject, injectable } from 'inversify'
import path from 'path'

import { FatalError } from '../errors'
import { TYPES } from '../misc/types'

import { BotConfig } from './bot.config'
import { BotpressConfig } from './botpress.config'
import { ModulesConfig } from './modules.config'

export interface ConfigProvider {
  getBotpressConfig(): Promise<BotpressConfig>
  getModulesConfig(): Promise<ModulesConfig>
  getBotConfig(botId: string): Promise<BotConfig>
}

@injectable()
export class FileConfigProvider implements ConfigProvider {
  constructor(@inject(TYPES.ProjectLocation) private projectLocation: string) {}

  async getBotpressConfig(): Promise<BotpressConfig> {
    const config = await this.getConfig<BotpressConfig>('botpress.config.json')

    config.httpServer.host = process.env.BP_HOST || config.httpServer.host
    config.httpServer.host = config.httpServer.host === 'localhost' ? undefined : config.httpServer.host

    return config
  }

  async getModulesConfig(): Promise<ModulesConfig> {
    return this.getConfig<ModulesConfig>('modules.config.json')
  }

  async getBotConfig(botId: string): Promise<BotConfig> {
    return this.getConfig<BotConfig>('bot.config.json', 'bots/' + botId)
  }

  private async getConfig<T>(fileName: string, directory?: string): Promise<T> {
    const filePath = directory
      ? path.join(this.getRootDir(), directory, fileName)
      : path.join(this.getRootDir(), fileName)

    return this.readFile(fileName, filePath)
  }

  private readFile<T>(fileName, filePath) {
    if (!fs.existsSync(filePath)) {
      throw new FatalError(`Configuration file "${fileName}" not found at "${filePath}"`)
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8')

      // Variables substitution
      content = content.replace('%BOTPRESS_DIR%', this.projectLocation)

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading configuration "${fileName}" at "${filePath}"`)
    }
  }

  private getRootDir(): string {
    return process.title === 'node' ? this.getDataConfigPath() : this.getBinaryDataConfigPath()
  }

  private getDataConfigPath() {
    return path.join(__dirname, '../../data')
  }

  private getBinaryDataConfigPath() {
    return path.join(path.dirname(process.execPath), 'data')
  }
}
