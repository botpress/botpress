import { BotRepository } from '../repositories/bot-repository'

import { BaseRouter } from './base-router'

export class BotRouter extends BaseRouter {
  constructor(private botRepository: BotRepository) {
    super()
  }

  setupRoutes() {
    this.router.get('/bots/:botId', async (request, response) => {
      const botId = request.params.botId
      const bot = await this.botRepository.getBotById(botId)

      response.send(bot)
    })
  }
}
