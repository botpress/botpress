import { Logger } from 'botpress/sdk'
import express from 'express'
import { injectable } from 'inversify'
import { inject, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../core/types'

import ActionService, { ScopedActionService } from './action-service'

const port = 4000

@injectable()
export class TaskEngine {
  private readonly app: express.Express
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'TaskEngine')
    private logger: Logger,
    @inject(TYPES.ActionService) private actionService: ActionService
  ) {
    this.app = express()

    this.app.get('/', (req, res) => res.send('Hello World!'))

    console.log(`Got logger: ${this.logger}`)
  }
  async start() {
    console.log('starting TaskEngine')
    this.app.listen(port, () => console.log(`Example app listening on port ${port}!`))
  }

  forBot(botId: string): ScopedActionService {
    return this.actionService.forBot(botId)
  }
}
