import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { assertSuperAdmin } from 'core/security'
import _ from 'lodash'
import { MessageType } from 'orchestrator'
import os from 'os'
import ChannelsRouter from './channels/channels-router'

import ChecklistRouter from './checklist/checklist-router'
import LanguagesRouter from './languages/languages-router'
import LicensingRouter from './licensing/licensing-router'
import ModulesRouter from './modules/modules-router'
import VersioningRouter from './versioning/router'

class ManagementRouter extends CustomAdminRouter {
  private versioningRouter: VersioningRouter
  private modulesRouter: ModulesRouter
  private checklistRouter: ChecklistRouter
  private languagesRouter: LanguagesRouter
  private licensingRouter: LicensingRouter
  private channelsRouter: ChannelsRouter
  private _rebootServer!: Function

  constructor(services: AdminServices) {
    super('Management', services)
    this.versioningRouter = new VersioningRouter(services)
    this.modulesRouter = new ModulesRouter(services)
    this.checklistRouter = new ChecklistRouter(services)
    this.languagesRouter = new LanguagesRouter(services)
    this.licensingRouter = new LicensingRouter(services)
    this.channelsRouter = new ChannelsRouter(services)

    this.router.use('/languages', this.languagesRouter.router)
    this.router.use('/versioning', assertSuperAdmin, this.versioningRouter.router)
    this.router.use('/modules', assertSuperAdmin, this.modulesRouter.router)
    this.router.use('/checklist', assertSuperAdmin, this.checklistRouter.router)
    this.router.use('/licensing', this.licensingRouter.router)
    this.router.use('/channels', this.channelsRouter.router)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.setupRoutes()
  }

  async setupRoutes() {
    this.router.get(
      '/configHash',
      this.asyncMiddleware(async (req, res) => {
        res.send({
          initialHash: this.configProvider.initialConfigHash,
          currentHash: this.configProvider.currentConfigHash
        })
      })
    )

    this.router.post(
      '/features/enable/:featureId',
      this.asyncMiddleware(async (req, res) => {
        const { featureId } = req.params

        if (featureId === 'pro') {
          await this.configProvider.mergeBotpressConfig({ pro: { enabled: true } })
        } else if (featureId === 'monitoring') {
          await this.configProvider.mergeBotpressConfig({ pro: { monitoring: { enabled: true } } })
        } else if (featureId === 'alerting') {
          await this.configProvider.mergeBotpressConfig({ pro: { alerting: { enabled: true } } })
        }

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/rebootServer',
      assertSuperAdmin,
      this.asyncMiddleware(async (req, res) => {
        const user = req.tokenUser!.email
        const config = await this.configProvider.getBotpressConfig()

        if (!config.allowServerReboot) {
          this.logger.warn(`User ${user} requested a server reboot, but the feature is disabled.`)
          return res.status(400).send('Rebooting the server is disabled in the botpress.config.json file')
        }

        const { hostname, serverId } = req.query
        this.logger.info(`User ${user} requested a server reboot for ${hostname}/${serverId}`)

        await this._rebootServer(serverId, hostname)
        res.sendStatus(200)
      })
    )

    this._rebootServer = await this.jobService.broadcast<void>(this.__local_rebootServer.bind(this))
  }

  private __local_rebootServer(serverId?: string, hostname?: string) {
    if (!hostname || !serverId || (hostname === os.hostname() && serverId === process.SERVER_ID)) {
      process.send!({ type: MessageType.RestartServer })
    }
  }
}

export default ManagementRouter
