import { BotRepository } from '../repositories/bot-repository'
import { BaseRouter } from './base-router'

export class BotRouter extends BaseRouter {
  constructor(private botRepository: BotRepository) {
    super()
  }

  setupRoutes() {
    this._router.get('/bots/:botId', (request, response) => {
      const botId = request.params.botId
      this.botRepository.getBotById(botId).then(bot => response.send(bot))
    })
  }

  get router() {
    return this._router
  }
}
