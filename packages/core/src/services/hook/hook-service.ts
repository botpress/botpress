import { BotpressAPI, BotpressEvent, Logger } from 'botpress-module-sdk'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import _ from 'lodash'
import { NodeVM } from 'vm2'

import { TYPES } from '../../misc/types'
import GhostService from '../ghost/service'

// type Hook =
//   | 'after_bot_start'
//   | 'after_message_receive'
//   | 'before_message_process'
//   | 'before_message_sent'
//   | 'before_session_end'
//   | 'after_timeout'

export namespace Hooks {
  export interface BaseHook {
    readonly folder: string
    readonly args: any
    readonly timeout: number
  }

  export class AfterBotStart implements BaseHook {
    timeout: number
    args: any
    folder: string = 'after_bot_start'

    constructor(private bp: BotpressAPI) {
      this.timeout = 1000
      this.args = { bp }
    }
  }

  export class AfterIncomingMiddleware implements BaseHook {
    folder: string
    args: any
    timeout: number

    constructor(bp: BotpressAPI, event: BotpressEvent) {
      this.timeout = 1000
      this.args = { bp, event }
      this.folder = 'after_incoming_middleware'
    }
  }

  export class BeforeSessionTimeout implements BaseHook {
    folder: string
    args: any
    timeout: number

    constructor(bp: BotpressAPI, event: BotpressEvent) {
      this.timeout = 1000
      this.args = { bp, event }
      this.folder = 'before_session_timeout'
    }
  }
}

class HookScript {
  constructor(public hook: Hooks.BaseHook, public path: string, public file: string) {}
}

@injectable()
export class HookService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'HookService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {}

  async executeHook(hook: Hooks.BaseHook): Promise<void> {
    const scripts = await this.extractScripts(hook)
    _.orderBy(scripts).forEach(script => this.runScript(script))
  }

  private async extractScripts(hook: Hooks.BaseHook): Promise<HookScript[]> {
    const filesPaths = await this.ghost.global().directoryListing('hooks/' + hook.folder, '*.js')

    return Promise.map(filesPaths, async path => {
      const file = await this.ghost.global().readFileAsString('hooks/' + hook.folder, path)
      return new HookScript(hook, path, file)
    })
  }

  private runScript(hookScript: HookScript) {
    const vm = new NodeVM({
      console: 'inherit',
      sandbox: hookScript.hook.args,
      timeout: hookScript.hook.timeout
    })

    try {
      vm.run(hookScript.file, hookScript.path)
      this.logger.debug(`Executed '${hookScript.path}' on '${hookScript.hook}'`)
    } catch (err) {
      this.logger.error(`Could not execute '${hookScript.path}' on '${hookScript.hook}'`)
    }
  }
}
