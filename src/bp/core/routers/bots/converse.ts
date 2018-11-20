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

  // Listen for an event that tells the engine is done processing
  // If the event match, return the content[]
  // Check for timeout, if an action is running

  setupRoutes() {
    this.router.post('/:userId', async (req, res) => {
      const { userId, botId } = req.params
      const rawResponses = await this.converseService.sendMessage(botId, userId, req.body)
      const formatedResponses = this.prepareResponse(rawResponses, req.query.return)
      return res.json(formatedResponses)
    })
  }

  private prepareResponse(responses, params) {
    const split = (params && params.split(';')) || []
    return responses.map(response => {
      let json = { response: response.response }
      if (split.includes('nlu')) {
        json = Object.assign({ nlu: response.nlu }, json)
      }
      if (split.includes('state')) {
        json = Object.assign({ state: response.state }, json)
      }
      return json
    })
  }
}
