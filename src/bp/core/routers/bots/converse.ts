import { Logger } from 'botpress/sdk'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { ConverseService } from 'core/services/converse'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import { asyncMiddleware, checkTokenHeader } from '../util'

export class ConverseRouter implements CustomRouter {
  public readonly router: Router
  private asyncMiddleware!: Function
  private checkTokenHeader!: RequestHandler

  constructor(private logger: Logger, private converseService: ConverseService, private authService: AuthService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.post(
      '/:userId',
      this.asyncMiddleware(async (req, res) => {
        const { userId, botId } = req.params
        const params = req.query.include

        if (params && params.includes('state')) {
          return res.send("The state can't be provided on a non-secure route").status(401)
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

    return output
  }
}
