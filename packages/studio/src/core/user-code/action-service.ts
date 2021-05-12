import { IO, Logger } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { ActionScope, LocalActionDefinition } from 'common/typings'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { NotFoundError } from 'core/routers/errors'
import { TYPES } from 'core/types'
import { WorkspaceService } from 'core/users'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'

import { extractMetadata } from './metadata'
import { enabled, getBaseLookupPaths } from './utils'

const debug = DEBUG('actions')
const DEBOUNCE_DELAY = ms('2s')

// node_production_modules are node_modules that are compressed for production
const EXCLUDES = ['**/node_modules/**', '**/node_production_modules/**']

export type RunType = 'trusted' | 'legacy' | 'http'

export interface ActionServerResponse {
  event: { state: Pick<IO.EventState, 'temp' | 'user' | 'session'> }
}

@injectable()
export class ActionService {
  private _scopedActions: Map<string, Promise<ScopedActionService>> = new Map()

  constructor(
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.Logger)
    @tagged('name', 'ActionService')
    private logger: Logger
  ) {}

  public async forBot(botId: string): Promise<ScopedActionService> {
    if (this._scopedActions.has(botId)) {
      return this._scopedActions.get(botId)!
    }

    const service = new Promise<ScopedActionService>(async cb => {
      if (!(await this.botService.botExists(botId, true))) {
        throw new NotFoundError('This bot does not exist')
      }

      const workspaceId = await this.workspaceService.getBotWorkspaceId(botId)
      cb(new ScopedActionService(this.ghost, this.logger, botId, this.cache, workspaceId))
    })

    this._scopedActions.set(botId, service)
    return service
  }
}

export class ScopedActionService {
  private _globalActionsCache: LocalActionDefinition[] | undefined
  private _localActionsCache: LocalActionDefinition[] | undefined
  private _scriptsCache: Map<string, string> = new Map()

  constructor(
    private ghost: GhostService,
    private logger: Logger,
    private botId: string,
    private cache: ObjectCache,
    private workspaceId: string
  ) {
    this._listenForCacheInvalidation()
  }

  async listActions(): Promise<LocalActionDefinition[]> {
    const globalActions = await this._listGlobalActions()
    const localActions = await this.listLocalActions()

    return globalActions.concat(localActions)
  }

  public async listLocalActions() {
    if (this._localActionsCache) {
      return this._localActionsCache
    }

    const actionFiles = (await this.ghost.forBot(this.botId).directoryListing('actions', '*.js', EXCLUDES)).filter(
      enabled
    )
    const actions = await Promise.map(actionFiles, async file => this._getActionDefinition(file, 'bot'))

    this._localActionsCache = actions
    return actions
  }

  private async _listGlobalActions() {
    if (this._globalActionsCache) {
      return this._globalActionsCache
    }

    const actionFiles = (await this.ghost.global().directoryListing('actions', '*.js', EXCLUDES)).filter(enabled)
    const actions = await Promise.map(actionFiles, async file => this._getActionDefinition(file, 'global'))

    this._globalActionsCache = actions
    return actions
  }

  private async _getActionDetails(actionName: string) {
    const action = await this._findAction(actionName)
    const code = await this._getActionScript(action.name, action.scope, action.legacy)

    const botFolder = action.scope === 'global' ? 'global' : `bots/${this.botId}`
    const dirPath = path.resolve(path.join(process.PROJECT_LOCATION, `/data/${botFolder}/actions/${actionName}.js`))
    const lookups = getBaseLookupPaths(dirPath, 'actions')

    return { code, dirPath, lookups, action }
  }

  private _listenForCacheInvalidation() {
    const clearDebounce = _.debounce(this._clearCache.bind(this), DEBOUNCE_DELAY, { leading: true, trailing: false })

    this.cache.events.on('invalidation', key => {
      if (key.toLowerCase().indexOf('/actions') > -1) {
        clearDebounce()
      }
    })
  }

  private _clearCache() {
    this._scriptsCache.clear()
    this._globalActionsCache = undefined
    this._localActionsCache = undefined
  }

  private async _getActionDefinition(file: string, scope: ActionScope): Promise<LocalActionDefinition> {
    const name = file.replace(/\.js|\.http\.js$/i, '')
    const legacy = !file.includes('.http.js')
    const script = await this._getActionScript(name, scope, legacy)

    return { name, scope, legacy, ...extractMetadata(script) }
  }

  private async _getActionScript(name: string, scope: ActionScope, legacy: boolean): Promise<string> {
    if (this._scriptsCache.has(name)) {
      return this._scriptsCache.get(name)!
    }

    let script: string
    if (scope === 'global') {
      script = await this.ghost.global().readFileAsString('actions', `${name}.js`)
    } else {
      const filename = legacy ? `${name}.js` : `${name}.http.js`
      script = await this.ghost.forBot(this.botId).readFileAsString('actions', filename)
    }

    this._scriptsCache.set(`${name}_${legacy}_${scope}`, script)
    return script
  }

  private async _findAction(actionName: string): Promise<LocalActionDefinition> {
    const actions = await this.listActions()
    const action = actions.find(x => x.name === actionName)

    if (!action) {
      throw new Error(`Action "${actionName}" not found`)
    }

    return action
  }
}
