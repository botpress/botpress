import axios from 'axios'
import { Logger } from 'botpress/sdk'
import { checkRule } from 'common/auth'
import LicensingService from 'common/licensing-service'
import { ConfigProvider } from 'core/config/config-loader'
import { ModuleLoader } from 'core/module-loader'
import { LogsRepository } from 'core/repositories/logs'
import { CustomRouter } from 'core/routers/customRouter'
import { assertSuperAdmin, checkTokenHeader } from 'core/routers/util'
import { GhostService } from 'core/services'
import { AlertingService } from 'core/services/alerting-service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { BotService } from 'core/services/bot-service'
import { JobService } from 'core/services/job-service'
import { MonitoringService } from 'core/services/monitoring'
import { WorkspaceService } from 'core/services/workspace-service'
import express, { RequestHandler, Router } from 'express'
import httpsProxyAgent from 'https-proxy-agent'
import _ from 'lodash'

import { HealthRouter } from './health/router'
import { ManagementRouter } from './management/router'
import { fixMappingMw } from './utils/apiMapper'
import { WorkspaceRouter } from './workspace/router'

export interface AdminServices {
  logger: Logger
  authService: AuthService
  workspaceService: WorkspaceService
  botService: BotService
  moduleLoader: ModuleLoader
  configProvider: ConfigProvider
  ghostService: GhostService
  monitoringService: MonitoringService
  logsRepository: LogsRepository
  licensingService: LicensingService
  alertingService: AlertingService
  jobService: JobService
}

class AdminRouter extends CustomRouter {
  private checkTokenHeader: RequestHandler
  private managementRouter: ManagementRouter
  private healthRouter: HealthRouter
  private workspaceRouter: WorkspaceRouter

  constructor(
    logger: Logger,
    private authService: AuthService,
    workspaceService: WorkspaceService,
    botService: BotService,
    private licensingService: LicensingService,
    ghostService: GhostService,
    configProvider: ConfigProvider,
    monitoringService: MonitoringService,
    alertingService: AlertingService,
    moduleLoader: ModuleLoader,
    jobService: JobService,
    logsRepository: LogsRepository
  ) {
    super('Admin', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)

    const adminServices: AdminServices = {
      logger,
      authService: this.authService,
      licensingService: this.licensingService,
      workspaceService,
      botService,
      moduleLoader,
      configProvider,
      ghostService,
      monitoringService,
      logsRepository,
      alertingService,
      jobService
    }

    this.managementRouter = new ManagementRouter(adminServices)
    this.healthRouter = new HealthRouter(adminServices)
    this.workspaceRouter = new WorkspaceRouter(adminServices)
  }

  setupRoutes(app: express.Express) {
    app.use('/api/v1/admin', this.checkTokenHeader, fixMappingMw, this.router)
    app.use('/api/v2/admin', this.checkTokenHeader, this.router)

    this.router.use('/management', assertSuperAdmin, this.managementRouter.router)
    this.router.use('/health', assertSuperAdmin, this.healthRouter.router)
    this.router.use('/workspace', this.workspaceRouter.router)

    this.router.get(
      '/permissions',
      this.asyncMiddleware(async (req, res) => {
        const { permissions, operation, resource } = req.body
        const valid = checkRule(permissions, operation, resource)
        res.send(valid)
      })
    )

    this.router.get(
      '/all-permissions',
      this.asyncMiddleware(async (req, res) => {
        res.json(await this.authService.getResources())
      })
    )

    this.router.get('/license', (req, res) => {
      const license = {
        isPro: process.IS_PRO_ENABLED
      }
      res.send(license)
    })

    this.router.get(
      '/audit',
      this.asyncMiddleware(async (req, res) => {
        res.send(await this.licensingService.auditLicensing(req.headers['x-bp-audit'] as string))
      })
    )

    this.router.get(
      '/docker_images',
      this.asyncMiddleware(async (req, res) => {
        try {
          const { data } = await axios.get(
            'https://hub.docker.com/v2/repositories/botpress/server/tags/?page_size=125&page=1&name=v',
            process.PROXY ? { httpsAgent: new httpsProxyAgent(process.PROXY) } : {}
          )

          res.send(data)
        } catch (err) {
          res.send({ results: [] })
        }
      })
    )
  }
}

export default AdminRouter
