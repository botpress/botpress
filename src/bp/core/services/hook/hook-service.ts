import * as sdk from 'botpress/sdk'
import { IO } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import path from 'path'
import { NodeVM } from 'vm2'

import { GhostService } from '..'
import { requireAtPaths } from '../../modules/require'
import { TYPES } from '../../types'
import { VmRunner } from '../action/vm'
import { Incident } from '../alerting-service'
import { WorkspaceUserAttributes } from 'core/repositories/workspace_users'

const debug = DEBUG('hooks')

interface HookOptions {
  timeout: number
}

export namespace Hooks {
  export class BaseHook {
    debug: IDebugInstance

    constructor(public folder: string, public args: any, public options: HookOptions = { timeout: 1000 }) {
      this.debug = debug.sub(folder)
    }
  }

  export class AfterServerStart extends BaseHook {
    constructor(private bp: typeof sdk) {
      super('after_server_start', { bp })
    }
  }

  export class AfterBotMount extends BaseHook {
    constructor(private bp: typeof sdk, botId: string) {
      super('after_bot_mount', { bp, botId })
    }
  }

  export class AfterBotUnmount extends BaseHook {
    constructor(private bp: typeof sdk, botId) {
      super('after_bot_unmount', { bp, botId })
    }
  }

  export class BeforeIncomingMiddleware extends BaseHook {
    constructor(bp: typeof sdk, event: IO.Event) {
      super('before_incoming_middleware', { bp, event })
    }
  }

  export class AfterIncomingMiddleware extends BaseHook {
    constructor(bp: typeof sdk, event: IO.Event) {
      super('after_incoming_middleware', { bp, event })
    }
  }

  export class BeforeOutgoingMiddleware extends BaseHook {
    constructor(bp: typeof sdk, event: IO.Event) {
      super('before_outgoing_middleware', { bp, event })
    }
  }

  export class AfterEventProcessed extends BaseHook {
    constructor(bp: typeof sdk, event: IO.Event) {
      super('after_event_processed', { bp, event })
    }
  }

  export class BeforeSessionTimeout extends BaseHook {
    constructor(bp: typeof sdk, event: IO.Event) {
      super('before_session_timeout', { bp, event })
    }
  }

  export class BeforeSuggestionsElection extends BaseHook {
    constructor(bp: typeof sdk, sessionId: string, event: IO.Event, suggestions: IO.Suggestion[]) {
      super('before_suggestions_election', { bp, sessionId, event, suggestions })
    }
  }

  export class OnIncidentStatusChanged extends BaseHook {
    constructor(bp: typeof sdk, incident: Incident) {
      super('on_incident_status_changed', { bp, incident })
    }
  }

  export class BeforeBotImport extends BaseHook {
    constructor(bp: typeof sdk, botId: string, tmpFolder: string, hookResult: object) {
      super('before_bot_import', { bp, botId, tmpFolder, hookResult })
    }
  }

  export class OnStageChangeRequest extends BaseHook {
    constructor(
      bp: typeof sdk,
      bot: sdk.BotConfig,
      users: WorkspaceUserAttributes[],
      pipeline: sdk.Pipeline,
      hookResult: any
    ) {
      super('on_stage_request', { bp, bot, users, pipeline, hookResult })
    }
  }

  export class AfterStageChanged extends BaseHook {
    constructor(
      bp: typeof sdk,
      previousBotConfig: sdk.BotConfig,
      bot: sdk.BotConfig,
      users: WorkspaceUserAttributes[],
      pipeline: sdk.Pipeline
    ) {
      super('after_stage_changed', { bp, previousBotConfig, bot, users, pipeline })
    }
  }
}

class HookScript {
  constructor(public path: string, public filename: string, public code: string) {}
}

@injectable()
export class HookService {
  private _scriptsCache: Map<string, HookScript[]> = new Map()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'HookService')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
  ) {
    this._listenForCacheInvalidation()
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', key => {
      if (key.toLowerCase().indexOf(`/hooks/`) > -1) {
        // clear the cache if there's any file that has changed in the `hooks` folder
        this._scriptsCache.clear()
      }
    })
  }

  async executeHook(hook: Hooks.BaseHook): Promise<void> {
    const scripts = await this.extractScripts(hook)
    await Promise.mapSeries(_.orderBy(scripts, ['filename'], ['asc']), script => this.runScript(script, hook))
  }

  async disableHook(hookName: string, hookType: string, moduleName?: string): Promise<boolean> {
    try {
      const rootPath = moduleName ? `/hooks/${hookType}/${moduleName}/` : `/hooks/${hookType}/`
      await this.ghost.global().renameFile(rootPath, hookName + '.js', `.${hookName}.js`)
      return true
    } catch (error) {
      // if the hook was already disabled or not found
      return false
    }
  }

  async enableHook(hookName: string, hookType: string, moduleName?: string): Promise<boolean> {
    try {
      const rootPath = moduleName ? `/hooks/${hookType}/${moduleName}/` : `/hooks/${hookType}/`
      await this.ghost.global().renameFile(rootPath, `.${hookName}.js`, hookName + '.js')
      return true
    } catch (error) {
      // if the hook was already enabled (or not found)
      return false
    }
  }

  private async extractScripts(hook: Hooks.BaseHook): Promise<HookScript[]> {
    if (this._scriptsCache.has(hook.folder)) {
      return this._scriptsCache.get(hook.folder)!
    }

    try {
      const filesPaths = await this.ghost.global().directoryListing('hooks/' + hook.folder, '*.js')
      const enabledFiles = filesPaths.filter(x => !path.basename(x).startsWith('.'))

      const scripts = await Promise.map(enabledFiles, async path => {
        const script = await this.ghost.global().readFileAsString('hooks/' + hook.folder, path)
        const filename = path.replace(/^.*[\\\/]/, '')
        return new HookScript(path, filename, script)
      })

      this._scriptsCache.set(hook.folder, scripts)
      return scripts
    } catch (err) {
      this._scriptsCache.delete(hook.folder)
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

  private async runScript(hookScript: HookScript, hook: Hooks.BaseHook) {
    const hookPath = `/data/global/hooks/${hook.folder}/${hookScript.path}.js`
    const dirPath = path.resolve(path.join(process.PROJECT_LOCATION, hookPath))

    const _require = this._prepareRequire(path.dirname(dirPath), hook.folder)

    const modRequire = new Proxy(
      {},
      {
        get: (_obj, prop) => _require(prop)
      }
    )

    const vm = new NodeVM({
      wrapper: 'none',
      console: 'inherit',
      sandbox: {
        ...hook.args,
        process: UntrustedSandbox.getSandboxProcessArgs(),
        printObject
      },
      timeout: hook.options.timeout,
      require: {
        external: true,
        mock: modRequire
      }
    })

    const botId = _.get(hook.args, 'event.botId')
    const vmRunner = new VmRunner()

    hook.debug.forBot(botId, 'before execute %o', { path: hookScript.path, botId, args: _.omit(hook.args, ['bp']) })
    process.BOTPRESS_EVENTS.emit(hook.folder, hook.args)
    await vmRunner.runInVm(vm, hookScript.code, hookScript.path).catch(err => {
      this.logScriptError(err, botId, hookScript.path, hook.folder)
    })
    hook.debug.forBot(botId, 'after execute')
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
}
