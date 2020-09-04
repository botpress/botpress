import { Logger } from 'botpress/sdk'
import * as sdk from 'botpress/sdk'
import { EntityDefCreateSchema, IntentDefCreateSchema } from 'common/validation'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { NLUService } from 'core/services/nlu/nlu-service'
import { WorkspaceService } from 'core/services/workspace-service'
import { RequestHandler, Router } from 'express'
import { validate } from 'joi'
import _ from 'lodash'
import yn from 'yn'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader, needPermissions } from '../util'

// TODO: not used anymore?
const removeSlotsFromUtterances = (utterances: { [key: string]: any }, slotNames: string[]) =>
  _.fromPairs(
    Object.entries(utterances).map(([key, val]) => {
      const regex = new RegExp(`\\[([^\\[\\]\\(\\)]+?)\\]\\((${slotNames.join('|')})\\)`, 'gi')
      return [key, val.map(u => u.replace(regex, '$1'))]
    })
  )

export class NLURouter extends CustomRouter {
  private _checkTokenHeader: RequestHandler
  private _needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    private logger: Logger,
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
    // TODO: Deprecate this
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

    // TODO: Deprecate this
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
          res.send(400)
        }
      })
    )

    this.router.post(
      '/entities',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        try {
          const entityDef = (await validate(req.body, EntityDefCreateSchema, {
            stripUnknown: true
          })) as sdk.NLU.EntityDefinition

          await this.nluService.entities.saveEntity(botId, entityDef)

          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .warn('Cannot create entity')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.post(
      '/entities/:id',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, id } = req.params
        try {
          const entityDef = (await validate(req.body, EntityDefCreateSchema, {
            stripUnknown: true
          })) as sdk.NLU.EntityDefinition

          await this.nluService.entities.updateEntity(botId, id, entityDef)
          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not update entity')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.post(
      '/entities/:id/delete',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, id } = req.params
        try {
          await this.nluService.entities.deleteEntity(botId, id)
          res.sendStatus(204)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not delete entity')
          res.status(404).send(err.message)
        }
      })
    )
  }
}
