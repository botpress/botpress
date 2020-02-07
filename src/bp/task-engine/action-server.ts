const express = require('express')
import { Logger } from 'botpress/sdk'
import { printObject } from 'core/misc/print'
import { inject, injectable, tagged } from 'inversify'
import yn from 'yn'

import { TYPES } from '../core/types'

const app = express()
const port = 4000

app.get('/', (req, res) => res.send('Hello World!'))

export const start = () => {
  console.log('starting action server')
  app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}

const debug = DEBUG('action-server')

@injectable()
class ScopedActionService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ActionService')
    private logger: Logger
  ) {
    console.log(`Got logger: ${logger}`)
  }

  // async runAction(actionName: string, incomingEvent: any, actionArgs: any): Promise<any> {
  //   process.ASSERT_LICENSED()

  //   if (yn(process.core_env.BP_EXPERIMENTAL_REQUIRE_BPFS)) {
  //     await this.checkActionRequires(actionName)
  //   }

  //   debug.forBot(incomingEvent.botId, 'run action', { actionName, incomingEvent, actionArgs })

  //   const { action, code, dirPath, lookups } = await this.getActionDetails(actionName)
  //   const _require = prepareRequire(dirPath, lookups)

  //   const api = await createForAction()

  //   const args = {
  //     bp: api,
  //     event: incomingEvent,
  //     user: incomingEvent.state.user,
  //     temp: incomingEvent.state.temp,
  //     session: incomingEvent.state.session,
  //     args: actionArgs,
  //     printObject: printObject,
  //     process: UntrustedSandbox.getSandboxProcessArgs()
  //   }

  //   try {
  //     let result
  //     if (action.location === 'global' && process.DISABLE_GLOBAL_SANDBOX) {
  //       result = await this.runWithoutVm(code, args, _require)
  //     } else {
  //       result = await this.runInVm(code, dirPath, args, _require)
  //     }

  //     debug.forBot(incomingEvent.botId, 'done running', { result, actionName, actionArgs })

  //     return result
  //   } catch (err) {
  //     this.logger
  //       .forBot(this.botId)
  //       .attachError(err)
  //       .error(`An error occurred while executing the action "${actionName}`)
  //     throw new ActionExecutionError(err.message, actionName, err.stack)
  //   }
  // }
}
