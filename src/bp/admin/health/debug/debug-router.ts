import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import _ from 'lodash'
import { getDebugScopes, setDebugScopes } from '../../../debug'

class DebugRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Debug', services)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/',
      this.asyncMiddleware(async (req, res) => {
        res.send(getDebugScopes())
      })
    )

    this.router.post(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const { debugScope, persist } = req.body

        if (persist) {
          await this.bpfs.global().upsertFile('/', 'debug.json', JSON.stringify({ scopes: debugScope.split(',') }))
        }

        setDebugScopes(debugScope)
        res.sendStatus(200)
      })
    )
  }
}

export default DebugRouter
