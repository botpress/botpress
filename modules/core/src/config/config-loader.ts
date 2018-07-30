import { inject, injectable } from 'inversify'

import { FatalError } from '../errors'
import { TYPES } from '../misc/types'
import { GhostContentService } from '../services/ghost-content'

import { BotpressConfig } from './botpress.config'
import { ModulesConfig } from './modules.config'

export interface ConfigProvider {
  getBotpressConfig(): Promise<BotpressConfig>
  getModulesConfig(): Promise<ModulesConfig>
}

const ROOT_FOLDER = '/'
const FILES_GLOB = '*.config.json'

@injectable()
export class GhostConfigProvider implements ConfigProvider {
  constructor(
    @inject(TYPES.GhostService) private ghostService: GhostContentService,
    @inject(TYPES.ProjectLocation) private projectLocation: string
  ) {
    this.ghostService.addRootFolder('global', ROOT_FOLDER, { filesGlob: FILES_GLOB, isBinary: false })
  }

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
    try {
      let content = <string>await this.ghostService.readFile('global', ROOT_FOLDER, fileName)

      if (!content) {
        throw new FatalError(`Modules configuration file "${fileName}" not found`)
      }

      // Variables substitution
      content = content.replace('%BOTPRESS_DIR%', this.projectLocation)

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading modules configuration "${fileName}"`)
    }
  }
}
