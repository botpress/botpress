import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { ConfigProvider } from './config/config-loader'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'

@injectable()
export class MiddlewareService {
  constructor(
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.ConfigProvider) private configLoader: ConfigProvider
  ) {}

  async getIncomingMiddlewaresForBot(botAlias: string) {
    const config = await this.configLoader.getBotConfig(botAlias)
    const availableModulesNames = await this.moduleLoader.getAvailableModules()

    // Probably not the best way to intersect 2 arrays
    const botModules = _.intersection(availableModulesNames.map(m => m.metadata.name, config.modules))
    return _.flatMap(
      availableModulesNames.filter(m => _.includes(botModules, m.metadata.name)).map(m => m.metadata.incomingMiddleware)
    )
  }
}
