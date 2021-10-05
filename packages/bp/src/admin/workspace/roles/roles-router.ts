import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { CHAT_USER_ROLE } from 'common/defaults'
import { sendSuccess } from 'core/routers'

import _ from 'lodash'

class RolesRouter extends CustomAdminRouter {
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
        const roles = workspace?.roles.slice() || []
        roles.push(CHAT_USER_ROLE)
        sendSuccess(res, 'Roles retrieved', { roles })
      })
    )
  }
}

export default RolesRouter
