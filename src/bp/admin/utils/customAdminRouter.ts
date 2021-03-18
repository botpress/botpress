import { AdminServices } from 'admin/admin-router'
import { Logger } from 'botpress/sdk'
import { AsyncMiddleware, asyncMiddleware } from 'common/http'
import LicensingService from 'common/licensing-service'
import { RequestWithUser } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import { LogsRepository } from 'core/logger'
import { ModuleLoader } from 'core/modules'
import { assertBotpressPro, checkTokenHeader, hasPermissions, loadUser, needPermissions } from 'core/routers/util'
import { GhostService } from 'core/services'
import { AlertingService } from 'core/services/alerting-service'
import { AuthStrategies } from 'core/services/auth-strategies'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { BotService } from 'core/services/bot-service'
import { JobService } from 'core/services/job-service'
import { MonitoringService } from 'core/services/monitoring'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'

export abstract class CustomAdminRouter {
  protected logger: Logger
  protected authService: AuthService
  protected configProvider: ConfigProvider
  protected moduleLoader: ModuleLoader
  protected bpfs: GhostService
  protected botService: BotService
  protected monitoringService: MonitoringService
  protected workspaceService: WorkspaceService
  protected logsRepository: LogsRepository
  protected licensingService: LicensingService
  protected alertingService: AlertingService
  protected jobService: JobService
  protected authStrategies: AuthStrategies

  protected readonly needPermissions: (operation: string, resource: string) => RequestHandler
  protected readonly asyncMiddleware: AsyncMiddleware
  protected readonly hasPermissions: (req: RequestWithUser, operation: string, resource: string) => Promise<boolean>
  protected readonly assertBotpressPro: RequestHandler
  protected readonly loadUser: RequestHandler
  protected readonly checkTokenHeader: RequestHandler

  public readonly router: Router

  constructor(name: string, services: AdminServices) {
    this.asyncMiddleware = asyncMiddleware(services.logger, name)
    this.needPermissions = needPermissions(services.workspaceService)
    this.hasPermissions = hasPermissions(services.workspaceService)
    this.assertBotpressPro = assertBotpressPro(services.workspaceService)
    this.loadUser = loadUser(services.authService)
    this.checkTokenHeader = checkTokenHeader(services.authService, TOKEN_AUDIENCE)

    this.router = Router({ mergeParams: true })

    this.logger = services.logger
    this.authService = services.authService
    this.configProvider = services.configProvider
    this.moduleLoader = services.moduleLoader
    this.bpfs = services.ghostService
    this.botService = services.botService
    this.monitoringService = services.monitoringService
    this.workspaceService = services.workspaceService
    this.logsRepository = services.logsRepository
    this.licensingService = services.licensingService
    this.alertingService = services.alertingService
    this.jobService = services.jobService
    this.authStrategies = services.authStrategies
  }
}
