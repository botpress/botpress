import { AdminServices } from 'admin/admin-router'
import { Logger } from 'botpress/sdk'
import { AsyncMiddleware, asyncMiddleware } from 'common/http'
import LicensingService from 'common/licensing-service'
import { RequestWithUser } from 'common/typings'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config/config-loader'
import { JobService } from 'core/distributed'
import { AlertingService, MonitoringService } from 'core/health'
import { LogsRepository } from 'core/logger'
import { MessagingService } from 'core/messaging'
import { ModuleLoader } from 'core/modules'
import { loadUser } from 'core/routers'
import {
  AuthStrategies,
  AuthService,
  TOKEN_AUDIENCE,
  needPermissions,
  hasPermissions,
  assertBotpressPro,
  checkTokenHeader
} from 'core/security'

import { WorkspaceService } from 'core/users'
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
  protected messagingService: MessagingService

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
    this.messagingService = services.messagingService
  }
}
