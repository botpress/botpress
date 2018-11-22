import { ConverseService } from 'core/services/converse'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '..'

export class ConverseRouter implements CustomRouter {
  public readonly router: Router

  constructor(private converseService: ConverseService) {
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.post('/:userId', async (req, res) => {
      const { userId, botId } = req.params
      const rawResponse = await this.converseService.sendMessage(botId, userId, req.body)
      const formatedResponse = this.prepareResponse(rawResponse, req.query.return)
      return res.json(formatedResponse)
    })
  }

  private prepareResponse(response, params) {
    const split = (params && params.split(';')) || []

    if (!split.includes('nlu')) {
      delete response.nlu
    }
    if (!split.includes('state')) {
      delete response.state
    }

    return response
  }
}
