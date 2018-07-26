import { MiddlewareService } from '../middlewares-service'

import { BaseRouter } from './base-router'

export class MiddlewaresRouter extends BaseRouter {
  constructor(private mwService: MiddlewareService) {
    super()
  }

  protected setupRoutes(): void {
    this._router.get('/middlewares/bots/:botId', (req, res) => {
      const botId = req.params.botId // TODO: Alias instead of ID?

      console.log('***** Middlesware route')

      this.mwService.getIncomingMiddlewaresForBot(botId).then(mws => {
        res.send(mws)
      })
    })
  }

  get router() {
    return this._router
  }
}
