import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { NodeVM, VMScript } from 'vm2'

import Database from '../../database'
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

class HookScript {
  constructor(public path: string, public file: string) {}
}

@injectable()
export class HookService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'HookService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.Database) private database: Database
  ) {
    ghost.global().addRootFolder('hooks')
  }

  async executeHook(hook: Hook): Promise<void> {
    const scripts = await this.extractScripts(hook)
    await Promise.map(scripts, script => this.runScript(script))
  }

  private async extractScripts(hook: Hook): Promise<HookScript[]> {
    const scripts: HookScript[] = []
    try {
      const filesPaths = await this.ghost.global().directoryListing('hooks/' + hook, '*.js')

      for (const path of filesPaths) {
        const file = await this.ghost.global().readFileAsString('hooks/' + hook, path)
        const hookScript = new HookScript(path, file)
        scripts.push(hookScript)
      }
    } catch (err) {
      if (err.cause().code === 'ENOENT') {
        this.logger.error(`Could not find any hooks for '${hook}'. ${err.cause().message}`)
      }
    }

    return scripts
  }

  private async runScript(hookScript: HookScript) {
    const vm = new NodeVM({
      timeout: 5000,
      console: 'inherit',
      sandbox: {
        database: this.database
      },
      require: {
        external: true
      }
    })
    const script = new VMScript(hookScript.file)

    try {
      vm.run(script)
    } catch (err) {
      this.logger.error(`Could not run script : ${hookScript.path}. ${err}`)
    }
  }
}
