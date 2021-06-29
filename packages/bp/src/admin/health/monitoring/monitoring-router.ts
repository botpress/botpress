import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import _ from 'lodash'

class MonitoringRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Monitoring', services)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.post(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const { fromTime, toTime } = req.body
        if (!_.isNumber(fromTime) || !_.isNumber(toTime)) {
          return res.sendStatus(400)
        }

        const config = await this.configProvider.getBotpressConfig()
        if (!_.get(config, 'pro.monitoring.enabled', false)) {
          return res.send(undefined)
        }

        res.send(await this.monitoringService.getStats(fromTime, toTime))
      })
    )
  }
}

export default MonitoringRouter
