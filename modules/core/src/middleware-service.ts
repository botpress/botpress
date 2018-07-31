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

  /**
   * Get middleware for enabled bot modules
   * @param botId
   */
  async getMiddlewareForBot(botId: string) {
    const config = await this.configLoader.getBotConfig(botId)
    const availableModules = await this.moduleLoader.getAvailableModules()

    const enabledBotModulesConfig = config.modules.filter(m => m.enabled)

    const incomingMiddlewareConfig = _.flatMap(enabledBotModulesConfig.map(mwc => mwc.incomingMiddleware))
    const outgoingMiddlewareConfig = _.flatMap(enabledBotModulesConfig.map(mwc => mwc.outgoingMiddleware))

    const enabledBotModules = availableModules.filter(m =>
      _.includes(enabledBotModulesConfig.map(mc => mc.name), m.metadata.name)
    )

    // Assign enabled config property to actual middleware
    const incomingMiddleware = _.flatMap(
      enabledBotModules.map(m =>
        m.metadata.incomingMiddleware.map(mw => {
          mw.enabled = incomingMiddlewareConfig.find(c => c.name === mw.name).enabled
          return mw
        })
      )
    )
    const outgoingMiddleware = _.flatMap(
      enabledBotModules.map(m =>
        m.metadata.outgoingMiddleware.map(mw => {
          mw.enabled = outgoingMiddlewareConfig.find(c => c.name === mw.name).enabled
          return mw
        })
      )
    )

    return [...incomingMiddleware, ...outgoingMiddleware]
  }
}
