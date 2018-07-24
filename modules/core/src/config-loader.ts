import path from 'path'
import fs from 'fs'
import { injectable } from 'inversify'
import { FatalError } from './Errors'

export type BotpressConfig = {}

export type ModuleConfigEntry = {
  url: string
}

export type ModulesConfig = {
  modules: Array<ModuleConfigEntry>
}

export interface ConfigProvider {
  getBotpressConfig(): Promise<BotpressConfig>
  getModulesConfig(): Promise<ModulesConfig>
}

@injectable()
export class FileConfigProvider implements ConfigProvider {
  private getRootDir(): string {
    if (process.title === 'node') {
      return path.join(__dirname, '../config')
    }

    return path.join(process.execPath, 'config')
  }

  async getBotpressConfig(): Promise<BotpressConfig> {
    return this.getConfig<BotpressConfig>('botpress.config.json')
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
}
