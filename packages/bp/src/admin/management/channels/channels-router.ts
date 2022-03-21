import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'

class ChannelsRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Channels', services)
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.get(
      '/listall',
      this.asyncMiddleware(async (req, res) => {
        console.log('/listall called!')
        res.send({ test: 'test test' })
      })
    )

    console.log('/listall registered!')
  }
}

export default ChannelsRouter
