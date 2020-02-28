import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import cluster from 'cluster'
import { ActionDefinition, ActionParameterDefinition } from 'common/typings'
import { BadRequestError, UnauthorizedError } from 'core/routers/errors'
import { ACTION_SERVER_AUDIENCE } from 'core/routers/sdk/utils'
import { asyncMiddleware } from 'core/routers/util'
import { TYPES } from 'core/types'
import express, { NextFunction, Request, Response } from 'express'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'

import { registerMsgHandler } from '../../../cluster'

import ActionService from './action-service'
import { HTTP_ACTIONS_PARAM_TYPES } from './utils'

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
  private asyncMiddleware: Function

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
      this.asyncMiddleware(async (req, res) => {
        const { incomingEvent, actionArgs, actionName, botId, token } = req.body

        const scopedActionService = await this.actionService.forBot(botId)
        await scopedActionService.runLocalAction({ actionName, actionArgs, incomingEvent, token, runType: 'http' })

        res.send({ incomingEvent })
      })
    )

    this.app.get(
      '/actions/:botId',
      _validateListActionsRequest,
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        const scopedActionService = await this.actionService.forBot(botId)
        const actions = await scopedActionService.listLocalActions()

        const body: ActionDefinition[] = actions
          .filter(a => !a.legacy)
          .map(a => ({
            params: a.params.reduce<ActionParameterDefinition[]>((acc, p) => {
              if (HTTP_ACTIONS_PARAM_TYPES.includes(p.type)) {
                acc.push(p)
              } else {
                this.logger.warn(`Ignoring parameter ${p.name} of type ${p.type} for action ${a.name}`)
              }

              return acc
            }, []),
            ..._.pick(a, ['name', 'category', 'description', 'author'])
          }))

        res.send(body)
      })
    )
  }
}

const MESSAGE_TYPE = 'start_local_action_server'
export const WORKER_TYPE = 'ACTION_WORKER'

export interface StartMessage {
  appSecret: string
  port: number
}

export const startLocalActionServer = (message: StartMessage) => {
  process.send!({ type: MESSAGE_TYPE, ...message })
}

if (cluster.isMaster) {
  registerMsgHandler(MESSAGE_TYPE, (message: StartMessage) => {
    const { appSecret, port } = message
    cluster.fork({ WORKER_TYPE, APP_SECRET: appSecret, PORT: port })
  })
}
