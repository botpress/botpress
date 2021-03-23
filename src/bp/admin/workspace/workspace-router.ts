import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { assertSuperAdmin } from 'core/security'
import _ from 'lodash'

import BotsRouter from './bots/bots-router'
import CollaboratorsRouter from './collaborators/collaborators-router'
import LogsRouter from './logs/logs-router'
import RolesRouter from './roles/roles-router'
import WorkspacesRouter from './workspaces/workspaces-router'

class WorkspaceRouter extends CustomAdminRouter {
  private botsRouter: BotsRouter
  private collaboratorsRouter: CollaboratorsRouter
  private logsRouter: LogsRouter
  private rolesRouter: RolesRouter
  private workspacesRouter: WorkspacesRouter

  constructor(services: AdminServices) {
    super('WorkspaceRouter', services)

    this.botsRouter = new BotsRouter(services)
    this.collaboratorsRouter = new CollaboratorsRouter(services)
    this.logsRouter = new LogsRouter(services)
    this.rolesRouter = new RolesRouter(services)
    this.workspacesRouter = new WorkspacesRouter(services)

    this.router.use('/bots', this.botsRouter.router)
    this.router.use('/collaborators', this.loadUser, this.collaboratorsRouter.router)
    this.router.use('/roles', this.rolesRouter.router)
    this.router.use('/logs', this.logsRouter.router)
    this.router.use('/workspaces', assertSuperAdmin, this.workspacesRouter.router)
  }
}

export default WorkspaceRouter
