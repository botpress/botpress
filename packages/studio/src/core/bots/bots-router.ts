import { Logger, RouterOptions } from 'botpress/sdk'

import { BotService } from 'core/bots'
import { ConfigProvider } from 'core/config'

import {
  AuthService,
  TOKEN_AUDIENCE,
  checkMethodPermissions,
  checkTokenHeader,
  needPermissions,
  checkBotVisibility
} from 'core/security'

import { WorkspaceService } from 'core/users'
import express, { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../routers/customRouter'

export class BotsRouter extends CustomRouter {
  private checkTokenHeader: RequestHandler
  private needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    private botService: BotService,
    private configProvider: ConfigProvider,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private logger: Logger
  ) {
    super('Bots', logger, Router({ mergeParams: true }))

    this.needPermissions = needPermissions(this.workspaceService)
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
  }

  async setupRoutes(app: express.Express) {
    app.use('/api/v1/bots/:botId', this.router)
    this.router.use(checkBotVisibility(this.configProvider, this.checkTokenHeader))

    this.router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.information'),
      this.asyncMiddleware(async (req, res) => {
        const bot = await this.botService.findBotById(req.params.botId)
        if (!bot) {
          return res.sendStatus(404)
        }

        res.send(bot)
      })
    )
  }
}
