import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import { HttpActionDefinition, HttpActionParameterDefinition, HttpActionParameterType } from 'common/typings'
import { Config } from 'core/app'
import { ConfigProvider } from 'core/config/config-loader'
import { BadRequestError, UnauthorizedError } from 'core/routers/errors'
import { AUDIENCE } from 'core/routers/sdk/utils'
import { TYPES } from 'core/types'
import express, { NextFunction, Request, Response } from 'express'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import jsonwebtoken from 'jsonwebtoken'

import { BotService } from '../bot-service'

import ActionService from './action-service'

const _validateRunRequest = (botService: BotService) => async (req: Request, res: Response, next: NextFunction) => {
  const { appSecret } = await Config.getBotpressConfig()

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
    jsonwebtoken.verify(token, appSecret, { audience: AUDIENCE })
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
    const config = await Config.getBotpressConfig()

    const localServerConfig = config.actionServers.localActionServer
    if (!localServerConfig.enabled) {
      this.logger.info('Local Action Server disabled')
      return
    }
    const port = localServerConfig.port

    this._initializeApp()
    this.app.listen(port, () => this.logger.info(`Local Action Server listening on port ${port}`))
  }

  private _initializeApp() {
    this.app.use(bodyParser.json())

    this.app.post('/action/run', _validateRunRequest(this.botService), async (req, res) => {
      const { incomingEvent, actionArgs, actionName, botId, token } = req.body

      await this.actionService
        .forBot(botId)
        .runLocalAction({ actionName, actionArgs, incomingEvent, token, runType: 'http' })

      res.send({ incomingEvent })
    })

    this.app.get('/actions/:botId', _validateListActionsRequest(this.botService), async (req, res) => {
      const { botId } = req.params

      const actions = await this.actionService.forBot(botId).listLocalActions()
      const nonLegacyActions = actions.filter(a => !a.legacy)

      const getParamType = (paramType: string): 'string' | 'number' | 'boolean' | undefined => {
        if (paramType === 'string') {
          return 'string'
        } else if (paramType === 'number') {
          return 'number'
        } else if (paramType === 'boolean') {
          return 'boolean'
        } else {
          return undefined
        }
      }

      const body: HttpActionDefinition[] = nonLegacyActions.map(a => ({
        name: a.name,
        description: a.description || '',
        category: a.category || '',
        author: a.author || '',
        parameters: (a.params || []).reduce<HttpActionParameterDefinition[]>((acc, p) => {
          const paramType: HttpActionParameterType | undefined = getParamType(p.type)
          if (paramType) {
            acc.push({
              name: p.name,
              type: paramType!,
              required: p.required,
              default: p.default,
              description: p.description
            })
          } else {
            this.logger.warn(`Ignoring parameter ${p.name} of type ${p.type} for action ${a.name}`)
          }

          return acc
        }, [])
      }))

      res.send(body)
    })
  }
}
