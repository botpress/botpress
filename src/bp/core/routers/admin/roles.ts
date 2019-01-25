import { Logger } from 'botpress/sdk'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from '..'
import { asyncMiddleware, needPermissions, success as sendSuccess } from '../util'

export class RolesRouter implements CustomRouter {
  public readonly router: Router

  private needPermissions!: (operation: string, resource: string) => RequestHandler
  private asyncMiddleware!: Function

  constructor(logger: Logger, private workspaceService: WorkspaceService) {
    this.needPermissions = needPermissions(this.workspaceService)
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.get(
      '/',
      this.needPermissions('read', 'admin.roles'),
      this.asyncMiddleware(async (req, res) => {
        const workspace = await this.workspaceService.getWorkspace()
        sendSuccess(res, 'Roles retrieved', {
          roles: workspace.roles
        })
      })
    )
  }
}
