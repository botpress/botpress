import fs from 'fs'
import { injectable } from 'inversify'
import path from 'path'

import { FatalError } from '../errors'

import { BotpressConfig } from './botpress.config'
import { ModulesConfig } from './modules.config'

export interface ConfigProvider {
  getBotpressConfig(): Promise<BotpressConfig>
  getModulesConfig(): Promise<ModulesConfig>
}

@injectable()
export class FileConfigProvider implements ConfigProvider {
  async getBotpressConfig(): Promise<BotpressConfig> {
    const config = await this.getConfig<BotpressConfig>('botpress.config.json')

    config.httpServer.host = process.env.BP_HOST || config.httpServer.host
    config.httpServer.host = config.httpServer.host === 'localhost' ? undefined : config.httpServer.host

    return config
  }

  async getModulesConfig(): Promise<ModulesConfig> {
    return this.getConfig<ModulesConfig>('modules.config.json')
  }

  private async getConfig<T>(fileName: string): Promise<T> {
    const filePath = path.join(this.getRootDir(), fileName)

    if (!fs.existsSync(filePath)) {
      throw new FatalError(`Modules configuration file "${fileName}" not found at "${filePath}"`)
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8')
      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading modules configuration "${fileName}" at "${filePath}"`)
    }
  }

  private getRootDir(): string {
    return process.title === 'node' ? this.getDevConfigPath() : this.getBinaryConfigPath()
  }

  private getDevConfigPath() {
    return path.join(__dirname, '../../data')
  }

  private getBinaryConfigPath() {
    return path.join(path.dirname(process.execPath), 'data')
  }
}
