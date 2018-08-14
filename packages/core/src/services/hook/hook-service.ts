import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import GhostService from '../ghost/service'

type Hook =
  | 'after_bot_start'
  | 'after_message_receive'
  | 'before_message_process'
  | 'before_message_sent'
  | 'before_session_end'
  | 'after_timeout'

@injectable()
export class HookService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'HookService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {
    ghost.global().addRootFolder('hooks')
  }

  async executeHook(hook: Hook): Promise<void> {
    try {
      const filesPaths = await this.ghost.global().directoryListing('hooks/' + hook, '*.js')
      const files = await Promise.map(filesPaths, path => this.ghost.global().readFileAsString('hooks/' + hook, path))

      // This will execute code so we asume it will be async
      await Promise.map(files, file => {
        eval(file)
      })
    } catch (err) {
      if (err.cause().code === 'ENOENT') {
        this.logger.error(`Could not find any hooks for '${hook}'. ${err.cause().message}`)
      }
    }
    return undefined
  }
}
