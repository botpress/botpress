import { AdminServices } from 'admin'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { sendSuccess } from 'core/routers/util'
import _ from 'lodash'

export class RolesRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Roles', services)
    this.setupRoutes()
  }

  setupRoutes() {
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
