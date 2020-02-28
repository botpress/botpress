import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import { ActionDefinition, ActionParameterDefinition, LocalActionDefinition } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import { BadRequestError, UnauthorizedError } from 'core/routers/errors'
import { ACTION_SERVER_AUDIENCE } from 'core/routers/sdk/utils'
import { TYPES } from 'core/types'
import express, { NextFunction, Request, Response } from 'express'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'

import { BotService } from '../bot-service'

import ActionService from './action-service'
import { HTTP_ACTIONS_PARAM_TYPES } from './utils'

const _validateRunRequest = (botService: BotService, appSecret: string) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

  const { botId, token } = req.body

  if (!(await botService.botExists(botId))) {
    return next(new BadRequestError('Unexisting bot'))
  }

  try {
    jsonwebtoken.verify(token, appSecret, { audience: ACTION_SERVER_AUDIENCE })
  } catch (err) {
    return next(new UnauthorizedError('Invalid token'))
  }

  next()
}

const _validateListActionsRequest = (botService: BotService) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

  const { botId } = req.params

  if (!(await botService.botExists(botId))) {
    return next(new BadRequestError('Unexisting bot'))
  }

  next()
}

@injectable()
export class LocalActionServer {
  private readonly app: express.Express
  private appSecret: string | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'LocalActionServer')
    private logger: Logger,
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {
    this.app = express()
  }

  public async start() {
    const { actionServers, appSecret } = await this.configProvider.getBotpressConfig()
    const { enabled, port } = actionServers.localActionServer

    if (!enabled) {
      this.logger.info('Local Action Server disabled')
      return
    }

    this._initializeApp(appSecret)
    this.app.listen(port, () => this.logger.info(`Local Action Server listening on port ${port}`))
  }

  private _initializeApp(appSecret: string) {
    this.app.use(bodyParser.json())

    this.app.post('/action/run', _validateRunRequest(this.botService, appSecret), async (req, res, next) => {
      const { incomingEvent, actionArgs, actionName, botId, token } = req.body

      try {
        await this.actionService
          .forBot(botId)
          .runLocalAction({ actionName, actionArgs, incomingEvent, token, runType: 'http' })
      } catch (e) {
        this.logger.attachError(e).error(`Error while executing action ${actionName}`)
        return next(e)
      }

      res.send({ incomingEvent })
    })

    this.app.get('/actions/:botId', _validateListActionsRequest(this.botService), async (req, res, next) => {
      const { botId } = req.params

      let actions: LocalActionDefinition[]
      try {
        actions = await this.actionService.forBot(botId).listLocalActions()
      } catch (e) {
        this.logger.attachError(e).error(`Error while listing actions for bot ${botId}`)
        return next(e)
      }

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
  }
}
