import axios from 'axios'
import { Logger } from 'botpress/sdk'
import { checkRule } from 'common/auth'
import LicensingService from 'common/licensing-service'
import { ConfigProvider } from 'core/config/config-loader'
import { ModuleLoader } from 'core/module-loader'
import { LogsRepository } from 'core/repositories/logs'
import { GhostService } from 'core/services'
import { AlertingService } from 'core/services/alerting-service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { BotService } from 'core/services/bot-service'
import { JobService } from 'core/services/job-service'
import { MonitoringService } from 'core/services/monitoring'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import httpsProxyAgent from 'https-proxy-agent'
import _ from 'lodash'
import moment from 'moment'
import yn from 'yn'

import { CustomRouter } from '../customRouter'
import { assertSuperAdmin, checkTokenHeader, loadUser, needPermissions } from '../util'

import { BotsRouter } from './bots'
import { LanguagesRouter } from './languages'
import { LicenseRouter } from './license'
import { RolesRouter } from './roles'
import { ServerRouter } from './server'
import { UsersRouter } from './users'
import { VersioningRouter } from './versioning'
import { WorkspacesRouter } from './workspaces'

export class AdminRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler
  private botsRouter!: BotsRouter
  private usersRouter!: UsersRouter
  private licenseRouter!: LicenseRouter
  private versioningRouter!: VersioningRouter
  private rolesRouter!: RolesRouter
  private serverRouter!: ServerRouter
  private languagesRouter!: LanguagesRouter
  private workspacesRouter!: WorkspacesRouter
  private loadUser!: RequestHandler
  private needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    logger: Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private botService: BotService,
    private licenseService: LicensingService,
    private ghostService: GhostService,
    configProvider: ConfigProvider,
    monitoringService: MonitoringService,
    alertingService: AlertingService,
    moduleLoader: ModuleLoader,
    jobService: JobService,
    private logsRepository: LogsRepository
  ) {
    super('Admin', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.botsRouter = new BotsRouter(logger, this.workspaceService, this.botService, configProvider)
    this.workspacesRouter = new WorkspacesRouter(logger, workspaceService, botService, configProvider)
    this.usersRouter = new UsersRouter(logger, this.authService, this.workspaceService)
    this.licenseRouter = new LicenseRouter(logger, this.licenseService, configProvider)
    this.versioningRouter = new VersioningRouter(logger, this.ghostService, this.botService)
    this.rolesRouter = new RolesRouter(logger, this.workspaceService)
    this.serverRouter = new ServerRouter(
      logger,
      monitoringService,
      workspaceService,
      alertingService,
      configProvider,
      ghostService,
      jobService
    )
    this.languagesRouter = new LanguagesRouter(logger, moduleLoader, this.workspaceService, configProvider)
    this.loadUser = loadUser(this.authService)
    this.needPermissions = needPermissions(this.workspaceService)

    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/permissions',
      this.asyncMiddleware(async (req, res) => {
        const { permissions, operation, resource } = req.body
        const valid = checkRule(permissions, operation, resource)
        res.send(valid)
      })
    )

    router.get(
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
        res.send(await this.licenseService.auditLicensing(req.headers['x-bp-audit'] as string))
      })
    )

    router.get(
      '/docker_images',
      this.asyncMiddleware(async (req, res) => {
        const { data } = await axios.get(
          'https://hub.docker.com/v2/repositories/botpress/server/tags/?page_size=125&page=1&name=v',
          process.PROXY ? { httpsAgent: new httpsProxyAgent(process.PROXY) } : {}
        )

        res.send(data)
      })
    )

    router.use('/bots', this.checkTokenHeader, this.botsRouter.router)
    router.use('/roles', this.checkTokenHeader, this.rolesRouter.router)
    router.use('/users', this.checkTokenHeader, this.loadUser, this.usersRouter.router)
    router.use('/license', this.checkTokenHeader, this.licenseRouter.router)
    router.use('/languages', this.checkTokenHeader, this.languagesRouter.router)
    router.use('/server', this.checkTokenHeader, assertSuperAdmin, this.serverRouter.router)
    router.use('/workspaces', this.checkTokenHeader, assertSuperAdmin, this.workspacesRouter.router)

    // TODO: Add versioning per workspace.
    // This way admins could use these routes to push / pull independently of other workspaces.
    // For now we're restricting to super-admin.
    router.use('/versioning', this.checkTokenHeader, assertSuperAdmin, this.versioningRouter.router)

    router.get(
      '/logs',
      this.checkTokenHeader,
      this.needPermissions('read', 'admin.logs'),
      this.asyncMiddleware(async (req, res) => {
        const { fromDate, toDate, onlyWorkspace } = req.query

        if (!fromDate || !toDate) {
          return res.status(400).send('fromDate and toDate must be specified')
        }

        const from = moment(parseInt(fromDate || ''))
        const to = moment(parseInt(toDate || ''))

        if (!from.isValid() || !to.isValid()) {
          return res.status(400).send('fromDate and toDate must be a valid unix timestamp')
        }

        let botIds
        if (!req.tokenUser?.isSuperAdmin || yn(onlyWorkspace)) {
          const botsRefs = await this.workspaceService.getBotRefs(req.workspace)
          botIds = (await this.botService.findBotsByIds(botsRefs)).filter(Boolean).map(x => x.id)
        }

        res.send(await this.logsRepository.searchLogs({ fromDate: from.toDate(), toDate: to.toDate(), botIds }))
      })
    )
  }
}
