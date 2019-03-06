import { Logger } from 'botpress/sdk'
import { AlertingService } from 'core/services/alerting-service'
import { MonitoringService } from 'core/services/monitoring'
import { Router } from 'express'

import { CustomRouter } from '../customRouter'
import { assertSuperAdmin } from '../util'

export class ServerRouter extends CustomRouter {
  constructor(logger: Logger, private monitoringService: MonitoringService, private alertingService: AlertingService) {
    super('Server', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.post(
      '/monitoring',
      this.asyncMiddleware(async (req, res) => {
        const { fromTime, toTime } = req.body
        res.send(await this.monitoringService.getStats(fromTime, toTime))
      })
    )

    router.post(
      '/incidents',
      assertSuperAdmin,
      this.asyncMiddleware(async (req, res) => {
        const { fromTime, toTime } = req.body
        res.send(await this.alertingService.getIncidents(fromTime, toTime))
      })
    )
  }
}
