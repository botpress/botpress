import { Logger } from 'botpress/sdk'
import { AnalyticsRepository } from 'core/repositories/analytics-repository'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader, needPermissions } from '../util'

export class AnalyticsRouter extends CustomRouter {
  private _checkTokenHeader: RequestHandler
  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    private logger: Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private analyticsRepo: AnalyticsRepository
  ) {
    super('Analytics', logger, Router({ mergeParams: true }))
    this._needPermissions = needPermissions(this.workspaceService)
    this._checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/channel/:channel/metric/:metric',
      this._checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { botId, channel, metric } = req.params
        // ?: not sure if a route for a single metric is useful
      })
    )

    this.router.get(
      '/channel/:channel',
      this._checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        // todo: return all named metrics
      })
    )

    this.router.get(
      '/',
      this._checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        // todo: return metrics for all bots
      })
    )
  }
}
