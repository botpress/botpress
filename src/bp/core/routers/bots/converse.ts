import { Logger } from 'botpress/sdk'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { ConverseService } from 'core/services/converse'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { checkTokenHeader } from '../util'

export class ConverseRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler

  constructor(logger: Logger, private converseService: ConverseService, private authService: AuthService) {
    super('Converse', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.post(
      '/:userId',
      this.asyncMiddleware(async (req, res) => {
        const { userId, botId } = req.params
        const params = req.query.include

        if (params && params.toLowerCase() !== 'responses') {
          return res.status(401).send("Unauthenticated converse API can only return 'responses'")
        }

        const rawOutput = await this.converseService.sendMessage(botId, userId, req.body)
        const formatedOutput = this.prepareResponse(rawOutput, params)

        return res.json(formatedOutput)
      })
    )

    this.router.post(
      '/:userId/secured',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { userId, botId } = req.params
        const rawOutput = await this.converseService.sendMessage(botId, userId, req.body)
        const formatedOutput = this.prepareResponse(rawOutput, req.query.include)

        return res.json(formatedOutput)
      })
    )
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

    return output
  }
}
