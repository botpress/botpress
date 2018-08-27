import express from 'express'
import { inject, injectable, tagged } from 'inversify'

import { Logger } from '../misc/interfaces'
import { TYPES } from '../misc/types'
import { BotRepository } from '../repositories/bot-repository'
import ActionService from '../services/action/action-service'
import AuthService from '../services/auth/auth-service'
import TeamsService from '../services/auth/teams-service'
import { CMSService } from '../services/cms/cms-service'
import FlowService from '../services/dialog/flow-service'
import { MiddlewareService } from '../services/middleware/middleware-service'

import { AuthRouter } from './auth-router'
import { BotRouter } from './bot-router'
import { IndexRouter } from './index-router'

@injectable()
export default class Router {
  private _router = express.Router()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Router')
    private logger: Logger,
    @inject(TYPES.BotRepository) private botRepository: BotRepository,
    @inject(TYPES.MiddlewareService) private middlewareService: MiddlewareService,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.TeamsService) private teamsService: TeamsService
  ) {
    const routers = {
      '/': new IndexRouter(),
      '/auth': new AuthRouter(this.logger, this.authService, this.teamsService),
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
