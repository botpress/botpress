import { MiddlewareService } from '../middleware-service'

import { BaseRouter } from './base-router'

export class MiddlewaresRouter extends BaseRouter {
  constructor(private middlewareService: MiddlewareService) {
    super()
  }

  setupRoutes() {
    this.router.get('/middlewares/bots/:botId', async (req, res) => {
      const botId = req.params.botId
      const middleware = await this.middlewareService.getMiddlewareForBot(botId)

      res.send(middleware)
    })
  }
}
