import * as sdk from 'botpress/sdk'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, TOKEN_AUDIENCE, checkTokenHeader, needPermissions } from 'core/security'
import { NLUService } from 'core/services/nlu/nlu-service'
import { WorkspaceService } from 'core/users'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'
import yn from 'yn'

export class NLURouter extends CustomRouter {
  private _checkTokenHeader: RequestHandler
  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    private logger: sdk.Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private nluService: NLUService
  ) {
    super('NLU', logger, Router({ mergeParams: true }))
    this._needPermissions = needPermissions(this.workspaceService)
    this._checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/intents',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const intentDefs = await this.nluService.intents.getIntents(botId)
        res.send(intentDefs)
      })
    )

    this.router.get(
      '/intents/:intent',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, intent } = req.params
        const intentDef = await this.nluService.intents.getIntent(botId, intent)
        res.send(intentDef)
      })
    )

    this.router.get(
      '/contexts',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const intents = await this.nluService.intents.getIntents(botId)
        const ctxs = _.chain(intents)
          .flatMap(i => i.contexts)
          .uniq()
          .value()

        res.send(ctxs)
      })
    )

    this.router.get(
      '/entities',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { ignoreSystem } = req.query

        const entities = await this.nluService.entities.getEntities(botId)
        const mapped = entities.map(x => ({ ...x, label: `${x.type}.${x.name}` }))

        res.json(yn(ignoreSystem) ? mapped.filter(x => x.type !== 'system') : mapped)
      })
    )

    this.router.get(
      '/entities/:entityName',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, entityName } = req.params
        try {
          const entity = await this.nluService.entities.getEntity(botId, entityName)
          res.send(entity)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error(`Could not get entity ${entityName}`)
          res.sendStatus(400)
        }
      })
    )
  }
}
