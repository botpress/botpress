import { MiddlewareService } from '../middleware-service'
import { BotRepository } from '../repositories/bot-repository'

import { BaseRouter } from './base-router'

export class BotRouter extends BaseRouter {
  constructor(private botRepository: BotRepository, private middlewareService: MiddlewareService) {
    super()
  }

  setupRoutes() {
    this.router.get('/bots/:botId', async (request, response) => {
      const botId = request.params.botId
      const bot = await this.botRepository.getBotById(botId)

      response.send(bot)
    })

    this.router.get('/bots/:botId/middleware', async (req, res) => {
      const botId = req.params.botId
      const middleware = await this.middlewareService.getMiddlewareForBot(botId)

      res.send(middleware)
    })

    this.router.post('/bots/:botId/middleware', async (req, res) => {
      const botId = req.params.botId
      const { middleware } = req.body
      await this.middlewareService.setMiddlewareForBot(botId, middleware)
      res.send(await this.middlewareService.getMiddlewareForBot(botId))
    })
  }
}
