import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import GhostService from '../ghost/service'
import { runCode } from '../sandbox/sandbox-launcher'

type Hook =
  | 'after_bot_start'
  | 'after_message_receive'
  | 'before_message_process'
  | 'before_message_sent'
  | 'before_session_end'
  | 'after_timeout'

class HookScript {
  constructor(public hook: Hook, public path: string, public file: string) {}
}

@injectable()
export class HookService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'HookService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {
    ghost.global().addRootFolder('hooks', { filesGlob: '**/*.js' })
  }

  async executeHook(hook: Hook): Promise<void> {
    const scripts = await this.extractScripts(hook)
    scripts.forEach(script => this.runScript(script))
  }

  private async extractScripts(hook: Hook): Promise<HookScript[]> {
    const filesPaths = await this.ghost.global().directoryListing('hooks/' + hook, '*.js')

    return Promise.map(filesPaths, async path => {
      const file = await this.ghost.global().readFileAsString('hooks/' + hook, path)
      return new HookScript(hook, path, file)
    })
  }

  private runScript(hookScript: HookScript) {
    runCode(hookScript.file, {})
      .then(() => this.logger.debug(`Executed '${hookScript.path}' on '${hookScript.hook}'`))
      .catch(() => this.logger.error(`Could not execute '${hookScript.path}' on '${hookScript.hook}'`))
  }
}
