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
    const botConfig = await this.configLoader.getBotConfig(botId)
    const availableModules = await this.moduleLoader.getAvailableModules()

    const enabledBotModules = availableModules.map(module => {
      const moduleConfig = botConfig.modules.find(x => x.name === module.metadata.name)

      if (!moduleConfig || !moduleConfig.enabled) {
        return { incomingMw: [], outgoingMw: [] }
      }

      const incomingMw = module.metadata.incomingMiddleware.map(mw => {
        const f = moduleConfig.incomingMiddleware.find(x => x.name === mw.name)
        return { ...mw, ...f }
      })

      const outgoingMw = module.metadata.outgoingMiddleware.map(mw => {
        const f = moduleConfig.outgoingMiddleware.find(x => x.name === mw.name)
        return { ...mw, ...f }
      })

      return { incomingMw, outgoingMw }
    })

    const incomingMw = _.orderBy(_.flatMap(enabledBotModules, m => m.incomingMw), ['order'])
    const outgoingMw = _.orderBy(_.flatMap(enabledBotModules, m => m.outgoingMw), ['order'])

    return [...incomingMw, ...outgoingMw]
  }
}
