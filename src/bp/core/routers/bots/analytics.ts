import { Logger } from 'botpress/sdk'
import { Analytics } from 'core/repositories/analytics-repository'
import AnalyticsService from 'core/services/analytics-service'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'
import moment from 'moment'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader, needPermissions } from '../util'

export class AnalyticsRouter extends CustomRouter {
  private _checkTokenHeader: RequestHandler
  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    private logger: Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private analytics: AnalyticsService
  ) {
    super('Analytics', logger, Router({ mergeParams: true }))
    this._needPermissions = needPermissions(this.workspaceService)
    this._checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/channel/:channel',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, channel } = req.params
        const { start, end } = req.query

        const startDate = this.unixToDate(start)
        const endDate = this.unixToDate(end)

        try {
          if (!channel || channel === 'all') {
            const analytics = await this.analytics.getDateRange(botId, startDate, endDate, undefined)
            res.send(analytics.map(this.toDto))
          } else {
            const analytics = await this.analytics.getDateRange(botId, startDate, endDate, channel)
            res.send(analytics.map(this.toDto))
          }
        } catch (err) {
          res.status(400).send(err.message)
        }
      })
    )
  }

  toDto(analytics: Partial<Analytics>) {
    return _.pick(analytics, ['metric_name', 'value', 'created_on', 'channel'])
  }

  unixToDate(unix) {
    const momentDate = moment.unix(unix)
    if (!momentDate.isValid()) {
      throw new Error(`Invalid unix timestamp format ${unix}.`)
    }

    return momentDate.toDate()
  }
}
