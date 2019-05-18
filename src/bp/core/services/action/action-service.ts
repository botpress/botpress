import { Logger } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import path from 'path'
import { NodeVM } from 'vm2'

import { GhostService } from '..'
import { createForAction } from '../../api'
import { requireAtPaths } from '../../modules/require'
import { TYPES } from '../../types'
import { BPError } from '../dialog/errors'

import { ActionMetadata, extractMetadata } from './metadata'
import { VmRunner } from './vm'

const debug = DEBUG('actions')

@injectable()
export default class ActionService {
  private _scopedActions: Map<string, ScopedActionService> = new Map()

  constructor(
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.Logger)
    @tagged('name', 'ActionService')
    private logger: Logger
  ) {}

  forBot(botId: string): ScopedActionService {
    if (this._scopedActions.has(botId)) {
      return this._scopedActions.get(botId)!
    }

    const scopedGhost = new ScopedActionService(this.ghost, this.logger, botId, this.cache)
    this._scopedActions.set(botId, scopedGhost)
    return scopedGhost
  }
}

type ActionLocation = 'local' | 'global'

export type ActionDefinition = {
  name: string
  isRemote: boolean
  location: ActionLocation
  metadata?: ActionMetadata
}

export class ScopedActionService {
  private _actionsCache: ActionDefinition[] | undefined
  private _scriptsCache: Map<string, string> = new Map()

  constructor(private ghost: GhostService, private logger: Logger, private botId: string, private cache: ObjectCache) {
    this._listenForCacheInvalidation()
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', key => {
      if (key.toLowerCase().indexOf(`/actions`) > -1) {
        this._scriptsCache.clear()
        this._actionsCache = undefined
      }
    })
  }

  async listActions(): Promise<ActionDefinition[]> {
    if (this._actionsCache) {
      return this._actionsCache
    }

    const filterDisabled = (filesPaths: string[]): string[] => filesPaths.filter(x => !path.basename(x).startsWith('.'))

    // node_production_modules are node_modules that are compressed for production
    const exclude = ['**/node_modules/**', '**/node_production_modules/**']
    const globalActionsFiles = filterDisabled(await this.ghost.global().directoryListing('actions', '*.js', exclude))
    const localActionsFiles = filterDisabled(
      await this.ghost.forBot(this.botId).directoryListing('actions', '*.js', exclude)
    )

    const actions: ActionDefinition[] = (await Promise.map(globalActionsFiles, async file =>
      this.getActionDefinition(file, 'global', true)
    )).concat(await Promise.map(localActionsFiles, async file => this.getActionDefinition(file, 'local', true)))

    this._actionsCache = actions
    return actions
  }

  private async getActionDefinition(
    file: string,
    location: ActionLocation,
    includeMetadata: boolean
  ): Promise<ActionDefinition> {
    let action: ActionDefinition = {
      name: file.replace(/.js$/i, ''),
      isRemote: false,
      location: location
    }

    if (includeMetadata) {
      const script = await this.getActionScript(action)
      action = { ...action, metadata: extractMetadata(script) }
    }

    return action
  }

  private async getActionScript(action: ActionDefinition): Promise<string> {
    if (this._scriptsCache.has(action.name)) {
      return this._scriptsCache.get(action.name)!
    }

    let script: string
    if (action.location === 'global') {
      script = await this.ghost.global().readFileAsString('actions', action.name + '.js')
    } else {
      script = await this.ghost.forBot(this.botId).readFileAsString('actions', action.name + '.js')
    }

    this._scriptsCache.set(action.name, script)
    return script
  }

  async hasAction(actionName: string): Promise<boolean> {
    const actions = await this.listActions()
    return !!actions.find(x => x.name === actionName)
  }

  private _prepareRequire(actionLocation: string) {
    let parts = path.relative(process.PROJECT_LOCATION, actionLocation).split(path.sep)
    parts = parts.slice(parts.indexOf('actions') + 1) // We only keep the parts after /actions/...

    const lookups: string[] = [actionLocation]

    if (parts[0] in process.LOADED_MODULES) {
      // the action is in a directory by the same name as a module
      lookups.unshift(process.LOADED_MODULES[parts[0]])
    }

    return module => requireAtPaths(module, lookups)
  }

  async runAction(actionName: string, incomingEvent: any, actionArgs: any): Promise<any> {
    process.ASSERT_LICENSED()

    debug.forBot(incomingEvent.botId, 'run action', { actionName, incomingEvent, actionArgs })

    const action = await this.findAction(actionName)
    const code = await this.getActionScript(action)
    const api = await createForAction()

    const botFolder = action.location === 'global' ? 'global' : 'bots/' + this.botId
    const dirPath = path.resolve(path.join(process.PROJECT_LOCATION, `/data/${botFolder}/actions/${actionName}.js`))

    const _require = this._prepareRequire(path.dirname(dirPath))

    const modRequire = new Proxy(
      {},
      {
        get: (_obj, prop) => _require(prop)
      }
    )

    const vm = new NodeVM({
      wrapper: 'none',
      sandbox: {
        bp: api,
        event: incomingEvent,
        user: incomingEvent.state.user,
        temp: incomingEvent.state.temp,
        session: incomingEvent.state.session,
        args: actionArgs,
        printObject: printObject,
        process: UntrustedSandbox.getSandboxProcessArgs()
      },
      require: {
        external: true,
        mock: modRequire
      },
      timeout: 5000
    })

    const runner = new VmRunner()

    const result = await runner.runInVm(vm, code, dirPath).catch(err => {
      this.logger.attachError(err).error(`An error occurred while executing the action "${actionName}`)
      throw new BPError(`An error occurred while executing the action "${actionName}"`, 'BP_451')
    })

    debug.forBot(incomingEvent.botId, 'done running', { result, actionName, actionArgs })

    return result
  }

  private async findAction(actionName: string): Promise<ActionDefinition> {
    const actions = await this.listActions()
    const action = actions.find(x => x.name === actionName)

    if (!action) {
      throw new Error(`Action "${actionName}" not found`)
    }

    return action
  }
}
