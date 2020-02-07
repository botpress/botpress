import { Logger } from 'botpress/sdk'
import { printObject } from 'core/misc/print'
import express, { NextFunction, Response } from 'express'
import { injectable } from 'inversify'
import { inject, tagged } from 'inversify'
import yn from 'yn'

import { TYPES } from '../core/types'

const port = 4000

@injectable()
export class TaskEngine {
  private readonly app: express.Express
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'TaskEngine')
    private logger: Logger
  ) {
    this.app = express()

    this.app.get('/', (req, res) => res.send('Hello World!'))

    console.log(`Got logger: ${this.logger}`)
  }
  async start() {
    console.log('starting TaskEngine')
    this.app.listen(port, () => console.log(`Example app listening on port ${port}!`))
  }
}
