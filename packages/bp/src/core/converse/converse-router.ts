import { Logger } from 'botpress/sdk'
import { StandardError } from 'common/http'
import { HTTPServer } from 'core/app/server'
import { ConfigProvider } from 'core/config'
import { ConverseService } from 'core/converse'
import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, TOKEN_AUDIENCE, checkTokenHeader } from 'core/security'
import { RequestHandler, Router } from 'express'
import joi from 'joi'
import _ from 'lodash'

// this schema ensures a non breaking api signature (> 11.5)
// see https://botpress.com/docs/build/channels/#usage-public-api
const conversePayloadSchema = {
  type: joi.string().valid('text'), // add other types as we need
  text: joi.string().required(),
  includedContexts: joi
    .array()
    .items(joi.string())
    .optional()
    .default(['global']),
  metadata: joi
    .object()
    .optional()
    .default({})
}

export class ConverseRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler

  constructor(
    logger: Logger,
    private converseService: ConverseService,
    private authService: AuthService,
    private httpServer: HTTPServer,
    private configProvider: ConfigProvider
  ) {
    super('Converse', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupSecuredRoute()
    this.setupPublicRoute()
  }

  setupPublicRoute() {
    this.router.post(
      '/:userId',
      this.shouldRespondToPublicEndpoint,
      this.httpServer.extractExternalToken,
      this.asyncMiddleware(async (req, res) => {
        try {
          await joi.validate(req.body, conversePayloadSchema)
        } catch (err) {
          throw new StandardError('Invalid payload', err)
        }

        const { userId, botId } = req.params
        const params = req.query.include

        if (params && params.toLowerCase() !== 'responses') {
          return res.status(403).send('Unauthenticated converse API can only return "responses"')
        }

        const rawOutput = await this.converseService.sendMessage(
          botId,
          userId,
          _.omit(req.body, ['includedContexts']),
          req.credentials,
          req.body.includedContexts || ['global']
        )
        const formatedOutput = this.prepareResponse(rawOutput, params)

        return res.json(formatedOutput)
      })
    )
  }

  setupSecuredRoute() {
    this.router.post(
      '/:userId/secured',
      this.checkTokenHeader,
      // Secured endpoint does not validate schema on purpose
      // DO NOT add this middleware: this.validatePayload
      // This is to validate user-created (non-trusted) payloads only
      this.httpServer.extractExternalToken,
      this.asyncMiddleware(async (req, res) => {
        const { userId, botId } = req.params

        const rawOutput = await this.converseService.sendMessage(
          botId,
          userId,
          _.omit(req.body, ['includedContexts']),
          req.credentials,
          req.body.includedContexts || ['global']
        )
        const formatedOutput = this.prepareResponse(rawOutput, req.query.include)

        return res.json(formatedOutput)
      })
    )
  }

  private shouldRespondToPublicEndpoint = async (req, res, next) => {
    const { botId } = req.params

    const enabledForBot = (await this.configProvider.getBotConfig(botId)).converse?.enableUnsecuredEndpoint ?? true
    if (!enabledForBot) {
      return res.status(403).send(`Unauthenticated Converse API is disabled for ${botId}`)
    }

    const enabledGlobal = (await this.configProvider.getBotpressConfig()).converse?.enableUnsecuredEndpoint ?? true
    if (!enabledGlobal) {
      return res.status(403).send('Unauthenticated Converse API is disabled for all bots')
    }

    next()
  }

  private prepareResponse(output, params: string) {
    const parts = (params && params.toLowerCase().split(',')) || []

    if (!parts.includes('nlu')) {
      delete output.nlu
    }

    if (!parts.includes('state')) {
      delete output.state
    }

    if (!parts.includes('suggestions')) {
      delete output.suggestions
    }

    if (!parts.includes('decision')) {
      delete output.decision
    }

    if (!parts.includes('credentials')) {
      delete output.credentials
    }

    return output
  }
}
