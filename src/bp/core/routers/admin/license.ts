import { Logger } from 'botpress/sdk'
import LicensingService, { LicenseInfo } from 'common/licensing-service'
import { RequestWithUser } from 'core/misc/interfaces'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { BadRequestError } from '../errors'
import { assertSuperAdmin, success as sendSuccess } from '../util'

export class LicenseRouter extends CustomRouter {
  constructor(logger: Logger, private licenseService: LicensingService) {
    super('License', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const svc = this.licenseService

    router.get(
      '/status',
      this.asyncMiddleware(async (req, res) => {
        const { tokenUser } = <RequestWithUser>req
        if (!process.IS_PRO_ENABLED) {
          return sendSuccess(res, 'License status', { isPro: false })
        }

        const status = await svc.getLicenseStatus()
        if (!tokenUser || !tokenUser.isSuperAdmin) {
          return sendSuccess(res, 'License status', { isPro: true, status: status.status })
        }

        // Only SuperAdmins can see the details of the server's license
        const clusterFingerprint = await svc.getFingerprint('cluster_url')

        let info: LicenseInfo | undefined
        try {
          info = await svc.getLicenseInfo()
        } catch (err) {}

        return sendSuccess(res, 'License status', {
          fingerprints: {
            cluster_url: clusterFingerprint
          },
          isPro: true,
          builtWithPro: process.IS_PRO_AVAILABLE,
          license: info,
          ...status
        })
      })
    )

    router.post(
      '/update',
      assertSuperAdmin,
      this.asyncMiddleware(async (req, res) => {
        const result = await svc.replaceLicenseKey(req.body.licenseKey)
        if (!result) {
          throw new BadRequestError('Invalid License Key')
        }

        return sendSuccess(res, 'License Key updated')
      })
    )

    router.post(
      '/refresh',
      assertSuperAdmin,
      this.asyncMiddleware(async (req, res) => {
        await svc.refreshLicenseKey()
        return sendSuccess(res, 'License refreshed')
      })
    )
  }
}
