import { MiddlewareService } from '../middleware-service'
import { BotRepository } from '../repositories/bot-repository'
import { CMSService } from '../services/cms'

import { BaseRouter } from './base-router'

export class BotRouter extends BaseRouter {
  constructor(
    private botRepository: BotRepository,
    private middlewareService: MiddlewareService,
    private cmsService: CMSService
  ) {
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

    this.router.get('/bots/:botId/content/types', async (req, res) => {
      const botId = req.params.botId
      const types = await this.cmsService.getAllContentTypes(botId)

      const response = await Promise.map(types, async type => {
        const count = await this.cmsService.countContentElements(botId, type.id)
        return {
          id: type.id,
          count,
          title: type.title,
          schema: {
            json: type.jsonSchema,
            ui: type.uiSchema,
            title: type.title,
            renderer: type.id
          }
        }
      })

      res.send(response)
    })
  }
}
