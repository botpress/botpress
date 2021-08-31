import * as sdk from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { ActionScope } from 'common/typings'
import { GhostService } from 'core/bpfs'
import { addErrorToEvent, addStepToEvent, StepScopes, StepStatus } from 'core/events'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { clearRequireCache, requireAtPaths } from 'core/modules'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'
import { NodeVM } from 'vm2'

import { filterDisabled, getBaseLookupPaths, runOutsideVm } from './utils'
import { VmRunner } from './vm'

const debug = DEBUG('hooks')
const DEBOUNCE_DELAY = ms('2s')

interface HookOptions {
  timeout: number
  throwOnError: boolean
}

const debugInstances: { [hookType: string]: IDebugInstance } = {}
const defaultHookOptions = Object.freeze({ timeout: 1000, throwOnError: false })

export namespace Hooks {
  export class BaseHook {
    debug: IDebugInstance

    constructor(public folder: string, public args: any, public options: HookOptions = defaultHookOptions) {
      if (debugInstances[folder]) {
        this.debug = debugInstances[folder]
      } else {
        this.debug = debugInstances[folder] = debug.sub(folder)
      }
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
    constructor(private bp: typeof sdk, botId: string) {
      super('after_bot_unmount', { bp, botId })
    }
  }

  export class BeforeIncomingMiddleware extends BaseHook {
    constructor(bp: typeof sdk, event: sdk.IO.Event) {
      super('before_incoming_middleware', { bp, event })
    }
  }

  export class AfterIncomingMiddleware extends BaseHook {
    constructor(bp: typeof sdk, event: sdk.IO.Event) {
      super('after_incoming_middleware', { bp, event })
    }
  }

  export class BeforeOutgoingMiddleware extends BaseHook {
    constructor(bp: typeof sdk, event: sdk.IO.Event) {
      super('before_outgoing_middleware', { bp, event })
    }
  }

  export class AfterEventProcessed extends BaseHook {
    constructor(bp: typeof sdk, event: sdk.IO.Event) {
      super('after_event_processed', { bp, event })
    }
  }

  export class BeforeSessionTimeout extends BaseHook {
    constructor(bp: typeof sdk, event: sdk.IO.Event) {
      super('before_session_timeout', { bp, event })
    }
  }

  export class BeforeConversationEnd extends BaseHook {
    constructor(bp: typeof sdk, event: sdk.IO.Event) {
      super('before_conversation_end', { bp, event })
    }
  }

  export class BeforeSuggestionsElection extends BaseHook {
    constructor(bp: typeof sdk, sessionId: string, event: sdk.IO.Event, suggestions: sdk.IO.Suggestion[]) {
      super('before_suggestions_election', { bp, sessionId, event, suggestions })
    }
  }

  export class OnIncidentStatusChanged extends BaseHook {
    constructor(bp: typeof sdk, incident: sdk.Incident) {
      super('on_incident_status_changed', { bp, incident })
    }
  }

  export class BeforeBotImport extends BaseHook {
    constructor(bp: typeof sdk, botId: string, tmpFolder: string, hookResult: object) {
      super('before_bot_import', { bp, botId, tmpFolder, hookResult })
    }
  }

  export class OnBotError extends BaseHook {
    constructor(bp: typeof sdk, botId: string, events: sdk.LoggerEntry[]) {
      super('on_bot_error', { bp, botId, events })
    }
  }

  export class OnStageChangeRequest extends BaseHook {
    constructor(
      bp: typeof sdk,
      bot: sdk.BotConfig,
      users: sdk.WorkspaceUserWithAttributes[],
      pipeline: sdk.Pipeline,
      hookResult: any
    ) {
      super('on_stage_request', { bp, bot, users, pipeline, hookResult }, { ...defaultHookOptions, throwOnError: true })
    }
  }

  export class AfterStageChanged extends BaseHook {
    constructor(
      bp: typeof sdk,
      previousBotConfig: sdk.BotConfig,
      bot: sdk.BotConfig,
      users: sdk.WorkspaceUserWithAttributes[],
      pipeline: sdk.Pipeline
    ) {
      super('after_stage_changed', { bp, previousBotConfig, bot, users, pipeline })
    }
  }
}

class HookScript {
  constructor(
    public path: string,
    public filename: string,
    public code: string,
    public name: string,
    public botId?: string
  ) {}
}

@injectable()
export class HookService {
  private _scriptsCache: Map<string, HookScript[]> = new Map()
  private _invalidateDebounce: ReturnType<typeof _.debounce>

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'HookService')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
  ) {
    this._listenForCacheInvalidation()
    this._invalidateDebounce = _.debounce(this._invalidateRequire, DEBOUNCE_DELAY, { leading: true, trailing: false })
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', key => {
      if (key.toLowerCase().indexOf('/hooks/') > -1 || key.toLowerCase().indexOf('/libraries') > -1) {
        // clear the cache if there's any file that has changed in the `hooks` folder
        this._scriptsCache.clear()
        this._invalidateDebounce()
      }
    })
  }

  private _invalidateRequire() {
    Object.keys(require.cache)
      .filter(r => r.match(/(\\|\/)(hooks|shared_libs|libraries)(\\|\/)/g))
      .map(file => delete require.cache[file])

    clearRequireCache()
  }

  async executeHook(hook: Hooks.BaseHook): Promise<void> {
    const botId = hook.args?.event?.botId || hook.args?.botId
    const scripts = await this.extractScripts(hook, botId)
    await Promise.mapSeries(_.orderBy(scripts, ['filename'], ['asc']), script => this.runScript(script, hook))
  }

  async disableHook(hookName: string, hookType: string, moduleName?: string): Promise<boolean> {
    try {
      const rootPath = moduleName ? `/hooks/${hookType}/${moduleName}/` : `/hooks/${hookType}/`
      await this.ghost.global().renameFile(rootPath, `${hookName}.js`, `.${hookName}.js`)
      return true
    } catch (error) {
      // if the hook was already disabled or not found
      return false
    }
  }

  async enableHook(hookName: string, hookType: string, moduleName?: string): Promise<boolean> {
    try {
      const rootPath = moduleName ? `/hooks/${hookType}/${moduleName}/` : `/hooks/${hookType}/`
      await this.ghost.global().renameFile(rootPath, `.${hookName}.js`, `${hookName}.js`)
      return true
    } catch (error) {
      // if the hook was already enabled (or not found)
      return false
    }
  }

  private async extractScripts(hook: Hooks.BaseHook, botId?: string): Promise<HookScript[]> {
    const scriptKey = botId ? `${hook.folder}_${botId}` : hook.folder

    if (this._scriptsCache.has(scriptKey)) {
      return this._scriptsCache.get(scriptKey)!
    }

    try {
      const globalHooks = filterDisabled(await this.ghost.global().directoryListing(`hooks/${hook.folder}`, '*.js'))
      const scripts = await Promise.map(globalHooks, async path => this._getHookScript(hook.folder, path))

      if (botId) {
        const botHooks = filterDisabled(await this.ghost.forBot(botId).directoryListing(`hooks/${hook.folder}`, '*.js'))
        scripts.push(...(await Promise.map(botHooks, async path => this._getHookScript(hook.folder, path, botId))))
      }

      this._scriptsCache.set(scriptKey, scripts)
      return scripts
    } catch (err) {
      this._scriptsCache.delete(scriptKey)
      return []
    }
  }

  private async _getHookScript(hookFolder: string, path: string, botId?: string) {
    let script: string
    if (!botId) {
      script = await this.ghost.global().readFileAsString(`hooks/${hookFolder}`, path)
    } else {
      script = await this.ghost.forBot(botId).readFileAsString(`hooks/${hookFolder}`, path)
    }

    const filename = path.replace(/^.*[\\\/]/, '')
    return new HookScript(path, filename, script, filename.replace('.js', ''), botId)
  }

  private _prepareRequire(fullPath: string, hookType: string, botId?: string) {
    const lookups = getBaseLookupPaths(fullPath, hookType, botId)

    return (module: string) => requireAtPaths(module, lookups, fullPath)
  }

  private async runScript(hookScript: HookScript, hook: Hooks.BaseHook) {
    const scope = (hookScript.botId ? `bots/${hookScript.botId}` : 'global') as ActionScope
    const hookPath = `/data/${scope}/hooks/${hook.folder}/${hookScript.path}.js`

    const dirPath = path.resolve(path.join(process.PROJECT_LOCATION, hookPath))

    const _require = this._prepareRequire(dirPath, hook.folder, hookScript.botId)

    const botId = _.get(hook.args, 'event.botId')

    hook.debug.forBot(botId, 'before execute %o', { path: hookScript.path, botId, args: _.omit(hook.args, ['bp']) })
    process.BOTPRESS_EVENTS.emit(hook.folder, hook.args)

    if (runOutsideVm(scope)) {
      await this.runWithoutVm(hookScript, hook, botId, _require)
    } else {
      await this.runInVm(hookScript, hook, botId, _require)
    }

    hook.debug.forBot(botId, 'after execute')
  }

  private addEventStep = (hookName: string, status: string, hook: Hooks.BaseHook, error?: any) => {
    if (!hook.args?.event) {
      return
    }

    const event = hook.args.event as sdk.IO.Event
    if (error) {
      addErrorToEvent(
        {
          type: 'hook-execution',
          stacktrace: error.stacktrace || error.stack,
          actionArgs: _.omit(hook.args, ['bp', 'event'])
        },
        event
      )
    }

    addStepToEvent(event, StepScopes.Hook, hookName, status)
  }

  private async runWithoutVm(hookScript: HookScript, hook: Hooks.BaseHook, botId: string, _require: Function) {
    const args = {
      ...hook.args,
      process: UntrustedSandbox.getSandboxProcessArgs(),
      printObject,
      require: _require
    }

    try {
      const fn = new Function(...Object.keys(args), hookScript.code)
      await fn(...Object.values(args))
      this.addEventStep(hookScript.name, StepStatus.Completed, hook)
      return
    } catch (err) {
      this.addEventStep(hookScript.name, StepStatus.Error, hook, err)
      this.logScriptError(err, botId, hookScript.path, hook.folder)
    }
  }

  private async runInVm(hookScript: HookScript, hook: Hooks.BaseHook, botId: string, _require: Function) {
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

    const vmRunner = new VmRunner()

    await vmRunner
      .runInVm(vm, hookScript.code, hookScript.path)
      .then(() => this.addEventStep(hookScript.name, 'completed', hook))
      .catch(err => {
        this.addEventStep(hookScript.name, 'error', hook, err)
        this.logScriptError(err, botId, hookScript.path, hook.folder)

        if (hook.options.throwOnError) {
          throw err
        }
      })
  }

  private logScriptError(err: Error, botId: string, path: string, folder: string) {
    const message = `An error occurred on "${path}" on "${folder}". ${err}`
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
