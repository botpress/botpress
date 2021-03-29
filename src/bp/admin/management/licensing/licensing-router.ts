import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { LicenseInfo } from 'common/licensing-service'
import { LicensingStatus, RequestWithUser } from 'common/typings'
import { BadRequestError, sendSuccess } from 'core/routers'
import { assertSuperAdmin } from 'core/security'
import _ from 'lodash'

const defaultResponse: LicensingStatus = {
  breachReasons: [],
  status: 'licensed',
  fingerprints: { cluster_url: '' },
  isBuiltWithPro: process.IS_PRO_AVAILABLE,
  isPro: process.IS_PRO_ENABLED
}

class LicensingRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Licensing', services)
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const svc = this.licensingService

    router.get(
      '/status',
      this.asyncMiddleware(async (req, res) => {
        const { tokenUser } = <RequestWithUser>req

        if (!process.IS_PRO_ENABLED) {
          return sendSuccess<LicensingStatus>(res, 'License status', { ...defaultResponse, isPro: false })
        }

        const status = await svc.getLicenseStatus()
        if (!tokenUser || !tokenUser.isSuperAdmin) {
          return sendSuccess<LicensingStatus>(res, 'License status', {
            ...defaultResponse,
            isPro: true,
            status: status.status
          })
        }

        // Only SuperAdmins can see the details of the server's license
        const clusterFingerprint = await svc.getFingerprint('cluster_url')

        let info: LicenseInfo | undefined
        try {
          info = await svc.getLicenseInfo()
        } catch (err) {}

        return sendSuccess<LicensingStatus>(res, 'License status', {
          ...defaultResponse,
          fingerprints: {
            cluster_url: clusterFingerprint
          },
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

        // We want to update the licenseKey in botpress.config.json if the user manually replaces its key
        const pro = {
          enabled: process.IS_PRO_ENABLED,
          licenseKey: req.body.licenseKey
        }
        await this.configProvider.mergeBotpressConfig({ pro })

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

    router.post(
      '/config/enablePro',
      this.asyncMiddleware(async (req, res) => {
        if (process.IS_PRO_ENABLED) {
          return res.send('Botpress Pro is already enabled.')
        }

        await this.configProvider.mergeBotpressConfig({ pro: { enabled: true } })
        res.send('Enabled successfully')
      })
    )
  }
}

export default LicensingRouter
