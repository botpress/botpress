import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import _ from 'lodash'

import BotsRouter from './bots/bots-router'

class WorkspaceRouter extends CustomAdminRouter {
  private botsRouter: BotsRouter

  constructor(services: AdminServices) {
    super('WorkspaceRouter', services)

    this.botsRouter = new BotsRouter(services)

    this.router.use('/bots', this.botsRouter.router)
  }
}

export default WorkspaceRouter
