import axios from 'axios'
import { injectable, tagged, inject } from 'inversify'
import ms from 'ms'

import { Throttle, Memoize } from 'lodash-decorators'
import { ModuleMetadata } from 'botpress-module-sdk'
import { TYPES } from './misc/types'
import { Logger } from './misc/interfaces'
import { ModuleConfigEntry, ModulesConfig } from './config/modules.config'
import { ConfigProvider } from './config/config-loader'

export type AvailableModule = {
  metadata: ModuleMetadata
  definition: ModuleConfigEntry
}

@injectable()
export class ModuleLoader {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ModuleLoader')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  @Memoize()
  private async loadConfiguration(): Promise<ModulesConfig> {
    return this.configProvider.getModulesConfig()
  }

  @Memoize()
  private async alertUnavailableModule(moduleUrl: string) {
    this.logger.warn(`Module at "${moduleUrl}" is not available`)
  }

  @Throttle(ms('5m'))
  async getAvailableModules(): Promise<AvailableModule[]> {
    const config = await this.loadConfiguration()

    const available: Map<string, AvailableModule> = new Map()

    for (const module of config.modules) {
      try {
        const { data } = await axios.get(`${module.url}/register`)
        const metadata = <ModuleMetadata>data

        // TODO Do more sophisticated check if metadata is valid
        if (!metadata || !metadata.name) {
          this.logger.error(`Invalid metadata received from module at "${module.url}". This module will be ignored.`)
          continue
        }

        const moduleName = metadata.name.toLowerCase()
        if (available.has(moduleName)) {
          this.logger.error(`Duplicated module "${moduleName}". This one will be ignored ("${module.url}".)`)
        } else {
          available.set(moduleName, {
            metadata: metadata,
            definition: module
          })
        }
      } catch (err) {
        this.alertUnavailableModule(module.url)
      }
    }

    return Array.from(available.values())
  }
}
