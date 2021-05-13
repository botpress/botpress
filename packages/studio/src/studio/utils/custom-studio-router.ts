import { Logger } from 'botpress/sdk'
import { AsyncMiddleware, asyncMiddleware } from 'common/http'
import { BotService } from 'core/bots'
import { GhostService, MemoryObjectCache } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { ConfigProvider } from 'core/config/config-loader'
import { FlowService } from 'core/dialog'
import { MediaServiceProvider } from 'core/media'
import { AuthService, TOKEN_AUDIENCE, needPermissions, checkTokenHeader } from 'core/security'
import { ActionServersService, ActionService, HintsService } from 'core/user-code'
import { WorkspaceService } from 'core/users'
import { RequestHandler, Router } from 'express'
import { StudioServices } from 'studio/studio-router'

export abstract class CustomStudioRouter {
  protected logger: Logger
  protected authService: AuthService
  protected configProvider: ConfigProvider
  protected botService: BotService
  protected mediaServiceProvider: MediaServiceProvider
  protected cmsService: CMSService
  protected workspaceService: WorkspaceService
  protected flowService: FlowService
  protected actionService: ActionService
  protected actionServersService: ActionServersService
  protected hintsService: HintsService
  protected bpfs: GhostService
  protected objectCache: MemoryObjectCache

  protected readonly needPermissions: (operation: string, resource: string) => RequestHandler
  protected readonly asyncMiddleware: AsyncMiddleware
  protected readonly checkTokenHeader: RequestHandler

  public readonly router: Router

  constructor(name: string, services: StudioServices) {
    this.asyncMiddleware = asyncMiddleware(services.logger, name)
    this.needPermissions = needPermissions(services.workspaceService)
    this.checkTokenHeader = checkTokenHeader(services.authService, TOKEN_AUDIENCE)

    this.router = Router({ mergeParams: true })

    this.logger = services.logger
    this.authService = services.authService
    this.configProvider = services.configProvider
    this.botService = services.botService
    this.mediaServiceProvider = services.mediaServiceProvider
    this.workspaceService = services.workspaceService
    this.cmsService = services.cmsService
    this.flowService = services.flowService
    this.actionService = services.actionService
    this.actionServersService = services.actionServersService
    this.bpfs = services.bpfs
    this.hintsService = services.hintsService
    this.objectCache = services.objectCache
  }
}
