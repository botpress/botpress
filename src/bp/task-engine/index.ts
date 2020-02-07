import { Logger } from 'botpress/sdk'
import { injectable } from 'inversify'
import { inject, tagged } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../core/types'

import { ActionServer } from './action-server'
import ActionService, { ScopedActionService } from './action-service'

@injectable()
export class TaskEngine {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'TaskEngine')
    private logger: Logger,
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.ActionServer) private actionServer: ActionServer
  ) {}
  async start() {
    await this.actionServer.start()
  }

  forBot(botId: string): ScopedActionService {
    return this.actionService.forBot(botId)
  }
}
