import { Logger } from 'botpress/sdk'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from '../customRouter'
import { needPermissions, success as sendSuccess } from '../util'

export class RolesRouter extends CustomRouter {
  private needPermissions!: (operation: string, resource: string) => RequestHandler

  constructor(logger: Logger, private workspaceService: WorkspaceService) {
    super('Roles', logger, Router({ mergeParams: true }))
    this.needPermissions = needPermissions(this.workspaceService)
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.get(
      '/',
      this.needPermissions('read', 'admin.roles'),
      this.asyncMiddleware(async (req, res) => {
        const workspace = await this.workspaceService.findWorkspace(req.workspace!)
        sendSuccess(res, 'Roles retrieved', {
          roles: (workspace && workspace.roles) || []
        })
      })
    )
  }
}
