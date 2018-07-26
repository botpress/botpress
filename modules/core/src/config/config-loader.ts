import fs from 'fs'
import { inject, injectable } from 'inversify'
import path from 'path'

import { FatalError } from '../errors'
import { TYPES } from '../misc/types'

import { BotpressConfig } from './botpress.config'
import { ModulesConfig } from './modules.config'

export interface ConfigProvider {
  getBotpressConfig(): Promise<BotpressConfig>
  getModulesConfig(): Promise<ModulesConfig>
  getBotConfig(botAlias: string): Promise<BotConfig>
}

export type BotConfig = {
  modules: [{ name: string }]
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

  async getBotConfig(botAlias: string): Promise<BotConfig> {
    const botRoot = path.join(this.getDataRootDir(), botAlias)
    console.log(botRoot)
    const fileName = 'bot.config.json'
    const filePath = path.join(botRoot, fileName)
    console.log(filePath)
    return this.readFile(fileName, filePath)
  }

  private async getConfig<T>(fileName: string): Promise<T> {
    const filePath = path.join(this.getRootDir(), fileName)
    return this.readFile(fileName, filePath)
  }

  private readFile<T>(fileName, filePath) {
    if (!fs.existsSync(filePath)) {
      throw new FatalError(`Modules configuration file "${fileName}" not found at "${filePath}"`)
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8')

      // Variables substitution
      content = content.replace('%BOTPRESS_DIR%', this.projectLocation)

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading modules configuration "${fileName}" at "${filePath}"`)
    }
  }

  private getRootDir(): string {
    return process.title === 'node' ? this.getDataConfigPath() : this.getBinaryDataConfigPath()
  }

  private getDataRootDir(): string {
    return process.title === 'node' ? this.getDataConfigPath() : this.getBinaryDataConfigPath()
  }

  private getDataConfigPath() {
    return path.join(__dirname, '../../data')
  }

  private getBinaryDataConfigPath() {
    return path.join(path.dirname(process.execPath), 'data')
  }
}
