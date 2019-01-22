import { Logger } from 'botpress/sdk'
import { WorkspaceService } from 'core/services/workspace-service'
import { Router } from 'express'

import { CustomRouter } from '..'
import { asyncMiddleware, success as sendSuccess } from '../util'

// TODO: Migrate to eventual workspace router
export class RolesRouter implements CustomRouter {
  public readonly router: Router

  private asyncMiddleware!: Function

  constructor(logger: Logger, private workspaceService: WorkspaceService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.get(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const workspace = await this.workspaceService.getWorkspace()
        sendSuccess(res, 'Roles retrieved', {
          roles: workspace.roles
        })
      })
    )
  }
}
