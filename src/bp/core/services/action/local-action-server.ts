import bodyParser from 'body-parser'
import { Logger } from 'botpress/sdk'
import { HttpActionDefinition } from 'common/typings'
import { Config } from 'core/app'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { TYPES } from 'core/types'
import express from 'express'
import { inject, injectable, tagged } from 'inversify'

import ActionService from './action-service'

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

    this.app.post('/action/run', async (req, res) => {
      const { incomingEvent, actionArgs, actionName, botId, token } = req.body

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
          token,
          args: actionArgs,
          printObject,
          process: UntrustedSandbox.getSandboxProcessArgs()
        },
        _require
      )

      res.status(200).send({ result, incomingEvent })
    })

    this.app.get('/actions/:botId', async (req, res) => {
      const { botId } = req.params
      const scopedActionService = this.actionService.forBot(botId)

      const actions = await scopedActionService.listLocalActions()
      const nonLegacyActions = actions.filter(a => !a.legacy)

      const getParamType = (paramType: string): 'string' | 'number' | 'boolean' => {
        if (paramType === 'string') {
          return 'string'
        } else if (paramType === 'number') {
          return 'number'
        } else if (paramType === 'boolean') {
          return 'boolean'
        } else if (paramType === 'any') {
          return 'string'
        } else {
          throw `Unexpected paramType: ${paramType}`
        }
      }

      const body: HttpActionDefinition[] = nonLegacyActions.map(a => ({
        name: a.name,
        description: a.metadata?.description || '',
        category: a.metadata?.category || '',
        parameters: (a.metadata?.params || []).map(p => ({
          name: p.name,
          type: getParamType(p.type),
          required: p.required,
          default: p.default,
          description: p.description
        }))
      }))

      res.status(200).send(body)
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
