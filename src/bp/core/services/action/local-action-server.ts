import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import { Config } from 'core/app'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { TYPES } from 'core/types'
import express from 'express'
import { inject, injectable, tagged } from 'inversify'
import url from 'url'

import ActionService from './action-service'

const port = 4000

@injectable()
export class LocalActionServer {
  private readonly app: express.Express
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'LocalActionServer')
    private logger: Logger,
    @inject(TYPES.ActionService) private actionService: ActionService
  ) {
    this.app = express()
    this.app.use(bodyParser.json())

    this.app.get('/', (req, res) => res.send('Hello World!'))
    // TODO: add route to return actions
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
    const config = await Config.getBotpressConfig()

    const localServerConfig = config.actionServers.localActionServer
    if (!localServerConfig.enabled) {
      this.logger.info('Local Action Server disabled')
      return
    }
    this.app.listen(localServerConfig.port, () => this.logger.info(`Local Action Server listening on port ${port}`))
  }
}
