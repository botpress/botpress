import * as sdk from 'botpress/sdk'
import { IO } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { NodeVM } from 'vm2'

import { GhostService } from '..'
import { TYPES } from '../../types'

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

    constructor(private bp: typeof sdk) {
      this.timeout = 1000
      this.args = { bp }
    }
  }

  export class AfterIncomingMiddleware implements BaseHook {
    folder: string
    args: any
    timeout: number

    constructor(bp: typeof sdk, event: IO.Event) {
      this.timeout = 1000
      this.args = { bp, event }
      this.folder = 'after_incoming_middleware'
    }
  }

  export class BeforeSessionTimeout implements BaseHook {
    folder: string
    args: any
    timeout: number

    constructor(bp: typeof sdk, event: IO.Event) {
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
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {}

  async executeHook(hook: Hooks.BaseHook): Promise<void> {
    const scripts = await this.extractScripts(hook)
    await Promise.mapSeries(_.orderBy(scripts, ['file'], ['asc']), script => this.runScript(script))
  }

  private async extractScripts(hook: Hooks.BaseHook): Promise<HookScript[]> {
    try {
      const filesPaths = await this.ghost.global().directoryListing('hooks/' + hook.folder, '*.js')

      return Promise.map(filesPaths, async path => {
        const file = await this.ghost.global().readFileAsString('hooks/' + hook.folder, path)
        return new HookScript(hook, path, file)
      })
    } catch (err) {
      return []
    }
  }

  private runScript(hookScript: HookScript) {
    const vm = new NodeVM({
      console: 'inherit',
      sandbox: hookScript.hook.args,
      timeout: hookScript.hook.timeout
    })

    const botId = _.get(hookScript.hook.args, 'event.botId')

    try {
      vm.run(hookScript.file, hookScript.path)
      this.logScriptRun(botId, hookScript.path, hookScript.hook.folder)
    } catch (err) {
      this.logScriptError(botId, hookScript.path, hookScript.hook.folder)
    }
  }

  private logScriptRun(botId, path, folder) {
    const message = `Executed '${path}' on '${folder}'`
    botId ? this.logger.forBot(botId).debug(message) : this.logger.debug(message)
  }

  private logScriptError(botId, path, folder) {
    const message = `Could not execute '${path}' on '${folder}'`
    botId ? this.logger.forBot(botId).error(message) : this.logger.error(message)
  }
}
