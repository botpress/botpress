import { IO, Logger } from 'botpress/sdk'

import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, TOKEN_AUDIENCE, checkTokenHeader, needPermissions } from 'core/security'
import { WorkspaceService } from 'core/users'
import { RequestHandler, Router, Response as ExpressResponse } from 'express'
import Joi from 'joi'
import _ from 'lodash'
import { BotNotMountedError, BotNotTrainedInLanguageError, HTTPError } from './errors'
import { NLUInferenceService } from './nlu-inference-service'

const PredictSchema = Joi.object().keys({
  contexts: Joi.array()
    .items(Joi.string())
    .default(['global']),
  text: Joi.string().required()
})

interface PredictBody {
  contexts: string[]
  text: string
}

interface PredictPath {
  botId: string
  lang: string | undefined
}

export class NLUInferenceRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler
  private needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    private logger: Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private nluInferenceService: NLUInferenceService
  ) {
    super('NLU-INFERENCE', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.needPermissions = needPermissions(this.workspaceService)
    this.setupRoutes()
  }

  private setupRoutes(): void {
    const router = this.router

    router.post(
      ['/predict/', '/predict/:lang'],
      this.checkTokenHeader,
      this.needPermissions('read', 'nlu'),
      this.asyncMiddleware(async (req, res) => {
        const { text, contexts } = this._validatePredictBody(req.body)
        const { botId, lang } = this._validatePredictPathParams(req.params)

        try {
          const nlu = await this.nluInferenceService.predict(botId, {
            includedContexts: contexts,
            utterance: text,
            language: lang
          })
          res.send({ nlu })
        } catch (error) {
          return this._mapError(botId, error)(res)
        }
      })
    )
  }

  private _validatePredictBody = (body: any): PredictBody => {
    const { error, value } = PredictSchema.validate(body)
    if (error) {
      throw new HTTPError(400, 'Predict body is invalid')
    }
    return value
  }

  private _validatePredictPathParams = (path: any): PredictPath => {
    const { botId, lang } = path
    return { botId, lang }
  }

  private _mapError = (botId: string, error: Error) => (res: ExpressResponse) => {
    if (error instanceof BotNotMountedError) {
      return res.status(404).send(error.message)
    }

    if (error instanceof BotNotTrainedInLanguageError) {
      return res.status(422).send(error.message)
    }

    if (error instanceof HTTPError) {
      return res.status(error.status).send(error.message)
    }

    const msg = 'An unexpected error occured.'
    this.logger
      .forBot(botId)
      .attachError(error)
      .error(msg)
    return res.status(500).send(msg)
  }
}
