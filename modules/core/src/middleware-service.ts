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
   * Get enabled middleware for enabled bot modules
   * @param botId
   */
  async getMiddlewareForBot(botId: string) {
    const config = await this.configLoader.getBotConfig(botId)
    const availableModules = await this.moduleLoader.getAvailableModules()

    const enabledBotModulesConfig = config.modules.filter(mc => mc.enabled)

    const enabledIncomingMiddlewareConfig = _.flatMap(
      enabledBotModulesConfig.map(mwc => mwc.incomingMiddleware.filter(mw => mw.enabled).map(mw => mw.name))
    )
    const enabledOutgoingMiddlewareConfig = _.flatMap(
      enabledBotModulesConfig.map(mwc => mwc.outgoingMiddleware.filter(mw => mw.enabled).map(mw => mw.name))
    )

    const enabledBotModules = availableModules.filter(m =>
      _.includes(enabledBotModulesConfig.map(mc => mc.name), m.metadata.name)
    )

    const incomingMiddleware = _.flatMap(
      enabledBotModules.map(m =>
        m.metadata.incomingMiddleware.filter(mw => _.includes(enabledIncomingMiddlewareConfig, mw.name))
      )
    )
    const outgoingMiddleware = _.flatMap(
      enabledBotModules.map(m =>
        m.metadata.outgoingMiddleware.filter(mw => _.includes(enabledOutgoingMiddlewareConfig, mw.name))
      )
    )

    return [...incomingMiddleware, ...outgoingMiddleware]
  }
}
