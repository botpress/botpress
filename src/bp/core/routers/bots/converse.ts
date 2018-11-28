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

      try {
        const rawOutput = await this.converseService.sendMessage(botId, userId, req.body)
        const formatedOutput = this.prepareResponse(rawOutput, req.query.include)

        return res.json(formatedOutput)
      } catch (err) {
        return res.status(408).json({ error: err })
      }
    })
  }

  private prepareResponse(output, params: string) {
    const split = (params && params.toLowerCase().split(',')) || []

    if (!split.includes('nlu')) {
      delete output.nlu
    }
    if (!split.includes('state')) {
      delete output.state
    }

    return output
  }
}
