import { Logger } from 'botpress/sdk'
import LicensingService, { LicenseInfo } from 'common/licensing-service'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import { asyncMiddleware, success as sendSuccess } from '../util'

export class LicenseRouter implements CustomRouter {
  private asyncMiddleware!: Function
  public readonly router: Router

  constructor(logger: Logger, private licenseService: LicensingService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const svc = this.licenseService

    router.get(
      '/status',
      this.asyncMiddleware(async (req, res) => {
        const status = await svc.getLicenseStatus()
        let info: LicenseInfo | undefined
        try {
          info = await svc.getLicenseInfo()
        } catch (err) {}

        return sendSuccess(res, 'License status', { license: info, ...status })
      })
    )
  }
}
