import { Logger } from 'botpress/sdk'
import express from 'express'
import { injectable } from 'inversify'
import { inject, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../core/types'

const port = 4000

@injectable()
export class ActionServer {
  private readonly app: express.Express
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'TaskEngine')
    private logger: Logger
  ) {
    this.app = express()

    this.app.get('/', (req, res) => res.send('Hello World!'))
    this.app.post('/action/run', (req, res) => {
      console.log('Running action')
      res.sendStatus(200)
    })
  }
  async start() {
    this.app.listen(port, () => console.log(`Action Server listening on port ${port}!`))
  }
}
