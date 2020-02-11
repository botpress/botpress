import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import { createForAction } from 'core/api'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { prepareRequire } from 'core/services/action/utils'
import express from 'express'
import { injectable } from 'inversify'
import { inject, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../core/types'

import ActionService from './action-service'

const port = 4000

@injectable()
export class ActionServer {
  private readonly app: express.Express
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'TaskEngine')
    private logger: Logger,
    @inject(TYPES.ActionService) private actionService: ActionService
  ) {
    this.app = express()
    this.app.use(bodyParser.json())

    this.app.get('/', (req, res) => res.send('Hello World!'))
    this.app.post('/action/run', async (req, res) => {
      const { incomingEvent, actionArgs, actionName, botId } = req.body

      const { action, code, dirPath, lookups, trusted } = await this.actionService
        .forBot(botId)
        .getActionDetails(actionName)
      if (trusted) {
        res.status(400).send({ error: 'Cannot run trusted code' })
      }

      const _require = prepareRequire(dirPath, lookups)

      const api = await createForAction()

      const args = {
        bp: api,
        event: incomingEvent,
        user: incomingEvent.state.user,
        temp: incomingEvent.state.temp,
        session: incomingEvent.state.session,
        args: actionArgs,
        printObject: printObject,
        process: UntrustedSandbox.getSandboxProcessArgs()
      }

      const result = await this.actionService.forBot(botId).runInVm(code, dirPath, args, _require)

      res.status(200).send({ result })
    })
  }
  async start() {
    this.app.listen(port, () => console.log(`Action Server listening on port ${port}!`))
  }
}
