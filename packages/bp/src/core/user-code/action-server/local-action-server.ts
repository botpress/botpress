import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import { ActionDefinition } from 'common/typings'
import { BadRequestError, UnauthorizedError } from 'core/routers/errors'
import { ACTION_SERVER_AUDIENCE } from 'core/routers/sdk/utils'
import { asyncMiddleware, AsyncMiddleware, TypedRequest, TypedResponse } from 'core/routers/util'
import { TYPES } from 'core/types'
import express, { NextFunction, Request, Response } from 'express'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'

import { ActionService, ActionServerResponse, RunActionProps } from '../action-service'

const _validateRunRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Joi.validate(
      req.body,
      Joi.object().keys({
        incomingEvent: Joi.object().required(),
        actionArgs: Joi.object().required(),
        actionName: Joi.string().required(),
        botId: Joi.string().required(),
        token: Joi.string().required()
      })
    )
  } catch (err) {
    return next(new BadRequestError(err))
  }

  const { token } = req.body

  try {
    jsonwebtoken.verify(token, process.env.APP_SECRET!, { audience: ACTION_SERVER_AUDIENCE })
  } catch (err) {
    return next(new UnauthorizedError('Invalid token'))
  }

  next()
}

const _validateListActionsRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Joi.validate(
      req.params,
      Joi.object().keys({
        botId: Joi.string().required()
      })
    )
  } catch (err) {
    return next(new BadRequestError(err))
  }

  next()
}

@injectable()
export class LocalActionServer {
  private readonly app: express.Express
  private asyncMiddleware: AsyncMiddleware

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'LocalActionServer')
    private logger: Logger,
    @inject(TYPES.ActionService) private actionService: ActionService
  ) {
    this.app = express()
    this.asyncMiddleware = asyncMiddleware(logger, 'LocalActionServer')
  }

  public listen() {
    const port = process.env.PORT

    this._initializeApp()
    this.app.listen(port, () => this.logger.info(`Local Action Server listening on port ${port}`))
  }

  private _initializeApp() {
    this.app.use(bodyParser.json())
    this.app.post(
      '/action/run',
      _validateRunRequest,
      this.asyncMiddleware(
        async (
          req: TypedRequest<
            RunActionProps & {
              botId: string
              token: string
            }
          >,
          res: TypedResponse<ActionServerResponse>
        ) => {
          const { actionArgs, actionName, botId, token, incomingEvent } = req.body

          const service = await this.actionService.forBot(botId)
          await service.runLocalAction({ actionName, actionArgs, incomingEvent, token, runType: 'http' })

          const { temp, user, session } = incomingEvent.state
          res.send({ event: { state: { temp, user, session } } })
        }
      )
    )

    this.app.get(
      '/actions/:botId',
      _validateListActionsRequest,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        const service = await this.actionService.forBot(botId)
        const actions = await service.listLocalActions()

        const body: ActionDefinition[] = actions
          .filter(a => !a.legacy)
          .map(a => ({
            name: a.name,
            category: a.category,
            params: a.params,
            description: a.description,
            author: a.author
          }))

        res.send(body)
      })
    )
  }
}
