import bodyParser from 'body-parser'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { TYPES } from 'core/types'
import express from 'express'
import { inject, injectable } from 'inversify'

import ActionService from './action-service'

const port = 4000

@injectable()
export class LocalActionServer {
  private readonly app: express.Express
  constructor(@inject(TYPES.ActionService) private actionService: ActionService) {
    this.app = express()
    this.app.use(bodyParser.json())

    this.app.get('/', (req, res) => res.send('Hello World!'))
    this.app.post('/action/run', async (req, res) => {
      const { incomingEvent, actionArgs, actionName, botId } = req.body

      const scopedActionService = this.actionService.forBot(botId)

      const { code, _require, dirPath } = await scopedActionService.loadLocalAction(actionName)

      const result = await scopedActionService.runInVm(
        code,
        dirPath,
        {
          event: incomingEvent,
          user: incomingEvent.state.user,
          temp: incomingEvent.state.temp,
          session: incomingEvent.state.session,
          args: actionArgs,
          printObject,
          process: UntrustedSandbox.getSandboxProcessArgs()
        },
        _require
      )

      res.status(200).send({ result, incomingEvent })
    })
  }
  async start() {
    this.app.listen(port, () => console.log(`Local Action Server listening on port ${port}!`))
  }
}
