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

    this.router.post(
      '/intents/:intent/delete',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, intent } = req.params
        try {
          await this.nluService.intents.deleteIntent(botId, intent)
          res.sendStatus(204)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not delete intent')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.post(
      '/intents',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        try {
          const intentDef = await validate(req.body, IntentDefCreateSchema, {
            stripUnknown: true
          })

          await this.nluService.intents.saveIntent(botId, intentDef)

          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .warn('Cannot create intent')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.post(
      '/intents/:intentName',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, intentName } = req.params
        try {
          await this.nluService.intents.updateIntent(botId, intentName, req.body)
          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not update intent')
          res.sendStatus(400)
        }
      })
    )

    this.router.post(
      '/condition/intentChanged',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { action } = req.body
        const condition = req.body.condition as sdk.DecisionTriggerCondition

        if (action === 'delete' || action === 'create') {
          try {
            await this.nluService.intents.updateContextsFromTopics(botId, [condition!.params!.intentName])
            return res.sendStatus(200)
          } catch (err) {
            return res.status(400).send(err.message)
          }
        }

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/sync/intents/topics',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { intentNames } = req.body

        try {
          await this.nluService.intents.updateContextsFromTopics(botId, intentNames)
          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not update intent topics')
          res.status(400).send(err.message)
        }
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

          const affectedIntents = (await this.nluService.intents.getIntents(botId)).filter(intent =>
            intent.slots.some(slot => slot.entities.includes(id))
          )

          await Promise.map(affectedIntents, intent => {
            const [affectedSlots, unaffectedSlots] = _.partition(intent.slots, slot => slot.entities.includes(id))
            const [slotsToDelete, slotsToKeep] = _.partition(affectedSlots, slot => slot.entities.length === 1)
            const updatedIntent = {
              ...intent,
              slots: [
                ...unaffectedSlots,
                ...slotsToKeep.map(slot => ({ ...slot, entities: _.without(slot.entities, id) }))
              ],
              utterances: removeSlotsFromUtterances(
                intent.utterances,
                slotsToDelete.map(slot => slot.name)
              )
            }
            return this.nluService.intents.saveIntent(botId, updatedIntent)
          })

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
