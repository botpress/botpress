import * as sdk from 'botpress/sdk'
import { IO } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import path from 'path'
import { NodeVM } from 'vm2'

import { GhostService } from '..'
import { requireAtPaths } from '../../modules/require'
import { TYPES } from '../../types'
import { VmRunner } from '../action/vm'
export namespace Hooks {
  export interface BaseHook {
    readonly folder: string
    readonly args: any
    readonly timeout: number
  }

  export class AfterServerStart implements BaseHook {
    timeout: number
    args: any
    folder: string = 'after_server_start'

    constructor(private bp: typeof sdk) {
      this.timeout = 1000
      this.args = { bp }
    }
  }

  export class AfterBotMount implements BaseHook {
    timeout: number
    args: any
    folder: string = 'after_bot_mount'

    constructor(private bp: typeof sdk, botId: string) {
      this.timeout = 1000
      this.args = { bp, botId }
    }
  }

  export class AfterBotUnmount implements BaseHook {
    timeout: number
    args: any
    folder: string = 'after_bot_unmount'

    constructor(private bp: typeof sdk, botId) {
      this.timeout = 1000
      this.args = { bp, botId }
    }
  }

  export class BeforeIncomingMiddleware implements BaseHook {
    folder: string
    args: any
    timeout: number

    constructor(bp: typeof sdk, event: IO.Event) {
      this.timeout = 1000
      this.args = { bp, event }
      this.folder = 'before_incoming_middleware'
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
  constructor(public hook: Hooks.BaseHook, public path: string, public filename: string, public code: string) {}
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
    await Promise.mapSeries(_.orderBy(scripts, ['filename'], ['asc']), script => this.runScript(script))
  }

  private async extractScripts(hook: Hooks.BaseHook): Promise<HookScript[]> {
    try {
      const filesPaths = await this.ghost.global().directoryListing('hooks/' + hook.folder, '*.js')
      return Promise.map(filesPaths, async path => {
        const script = await this.ghost.global().readFileAsString('hooks/' + hook.folder, path)
        const filename = path.replace(/^.*[\\\/]/, '')
        return new HookScript(hook, path, filename, script)
      })
    } catch (err) {
      return []
    }
  }

  private _prepareRequire(hookLocation: string, hookType: string) {
    let parts = path.relative(process.PROJECT_LOCATION, hookLocation).split(path.sep)
    parts = parts.slice(parts.indexOf(hookType) + 1) // We only keep the parts after /hooks/{type}/...

    const lookups: string[] = [hookLocation]

    if (parts[0] in process.LOADED_MODULES) {
      // the hook is in a directory by the same name as a module
      lookups.unshift(process.LOADED_MODULES[parts[0]])
    }

    return module => requireAtPaths(module, lookups)
  }

  private async runScript(hookScript: HookScript) {
    const hookPath = `/data/global/hooks/${hookScript.hook.folder}/${hookScript.path}.js`
    const dirPath = path.resolve(path.join(process.PROJECT_LOCATION, hookPath))

    const _require = this._prepareRequire(path.dirname(dirPath), hookScript.hook.folder)

    const modRequire = new Proxy(
      {},
      {
        get: (_obj, prop) => _require(prop)
      }
    )

    const vm = new NodeVM({
      wrapper: 'none',
      console: 'inherit',
      sandbox: hookScript.hook.args,
      timeout: hookScript.hook.timeout,
      require: {
        external: true,
        mock: modRequire
      }
    })

    const botId = _.get(hookScript.hook.args, 'event.botId')
    const vmRunner = new VmRunner()

    await vmRunner.runInVm(vm, hookScript.code, hookScript.path).catch(err => {
      this.logScriptError(err, botId, hookScript.path, hookScript.hook.folder)
    })
    this.logScriptRun(botId, hookScript.path, hookScript.hook.folder)
  }

  private logScriptError(err, botId, path, folder) {
    const message = `An error occured on "${path}" on "${folder}". ${err}`
    if (botId) {
      this.logger
        .forBot(botId)
        .attachError(err)
        .error(message)
    } else {
      this.logger.attachError(err).error(message)
    }
  }

  private logScriptRun(botId, path, folder) {
    const message = `Executed "${path}" on "${folder}"`
    botId ? this.logger.forBot(botId).debug(message) : this.logger.debug(message)
  }
}
