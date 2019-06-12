import { Logger } from 'botpress/sdk'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { HintsService } from 'core/services/hints'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader, needPermissions } from '../util'

export class HintsRouter extends CustomRouter {
  private _checkTokenHeader: RequestHandler
  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    logger: Logger,
    private hintsService: HintsService,
    private authService: AuthService,
    private workspaceService: WorkspaceService
  ) {
    super('Hints', logger, Router({ mergeParams: true }))
    this._needPermissions = needPermissions(this.workspaceService)
    this._checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'), // if you can read content you can get suggestions
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const allHints = this.hintsService.getHintsForBot(botId)
        res.send({ inputs: allHints.filter(x => x.scope === 'inputs') })
      })
    )
  }
}
