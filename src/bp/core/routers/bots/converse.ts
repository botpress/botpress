import { Logger } from 'botpress/sdk'
import { ConverseService } from 'core/services/converse'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'
import { asyncMiddleware } from '../util'

export class ConverseRouter implements CustomRouter {
  public readonly router: Router
  private asyncMiddleware!: Function

  constructor(private logger: Logger, private converseService: ConverseService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.post(
      '/:userId',
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
