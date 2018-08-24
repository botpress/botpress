import express from 'express'
import { inject, injectable } from 'inversify'

import { TYPES } from '../misc/types'
import { BotRepository } from '../repositories/bot-repository'
import ActionService from '../services/action/action-service'
import { CMSService } from '../services/cms/cms-service'
import FlowService from '../services/dialog/flow-service'
import { MiddlewareService } from '../services/middleware/middleware-service'

import { BotRouter } from './bot-router'
import { IndexRouter } from './index-router'

@injectable()
export default class Router {
  private _router = express.Router()

  constructor(
    @inject(TYPES.BotRepository) private botRepository: BotRepository,
    @inject(TYPES.MiddlewareService) private middlewareService: MiddlewareService,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.ActionService) private actionService: ActionService
  ) {
    const routers = {
      '/': new IndexRouter(),
      '/bots': new BotRouter({
        actionService: this.actionService,
        botRepository: this.botRepository,
        cmsService: this.cmsService,
        flowService: this.flowService,
        middlewareService: this.middlewareService
      })
    }

    Object.keys(routers).forEach(prefix => {
      this._router.use(prefix, routers[prefix].router)
    })
  }

  get router() {
    return this._router
  }
}
