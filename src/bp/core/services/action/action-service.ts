import axios from 'axios'
import { IO, Logger } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { createForAction } from 'core/api'
import Database from 'core/database'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { clearRequireCache, requireFromString } from 'core/modules/require'
import { GhostService } from 'core/services'
import { ActionMetadata, extractMetadata } from 'core/services/action/metadata'
import {
  extractRequiredFiles,
  getBaseLookupPaths,
  prepareRequire,
  prepareRequireTester
} from 'core/services/action/utils'
import { VmRunner } from 'core/services/action/vm'
import { ActionExecutionError } from 'core/services/dialog/errors'
import { TYPES } from 'core/types'
import { injectable } from 'inversify'
import { inject, tagged } from 'inversify'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'
import { NodeVM } from 'vm2'
import yn from 'yn'

const debug = DEBUG('action-server')
const DEBOUNCE_DELAY = ms('2s')

type ActionLocation = 'local' | 'global'

export type ActionDefinition = {
  name: string
  isRemote: boolean
  location: ActionLocation
  metadata?: ActionMetadata
}

@injectable()
export default class ActionService {
  private _scopedActions: Map<string, ScopedActionService> = new Map()
  private _invalidateDebounce

  constructor(
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'ActionService')
    private logger: Logger
  ) {
    this._listenForCacheInvalidation()
    this._invalidateDebounce = _.debounce(this._invalidateRequire, DEBOUNCE_DELAY, { leading: true, trailing: false })
  }

  forBot(botId: string): ScopedActionService {
    if (this._scopedActions.has(botId)) {
      return this._scopedActions.get(botId)!
    }

    const scopedActionService = new ScopedActionService(this.ghost, this.logger, botId, this.cache, this.database)
    this._scopedActions.set(botId, scopedActionService)
    return scopedActionService
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', key => {
      if (key.toLowerCase().indexOf(`/actions`) > -1) {
        this._invalidateDebounce(key)
      }
    })
  }

  // Debouncing invalidate since we get a lot of events when it happens
  private _invalidateRequire() {
    Object.keys(require.cache)
      .filter(r => r.match(/(\\|\/)actions(\\|\/)/g))
      .map(file => delete require.cache[file])

    clearRequireCache()
  }
}

interface RunActionProps {
  actionName: string
  actionServer?: ActionServer
  incomingEvent: IO.IncomingEvent
  actionArgs: any
}

interface ActionServer {
  baseUrl: string
}

export class ScopedActionService {
  private _actionsCache: ActionDefinition[] | undefined
  private _scriptsCache: Map<string, string> = new Map()
  // Keeps a quick index of files which have already been required
  private _validScripts: { [filename: string]: boolean } = {}

  constructor(
    private ghost: GhostService,
    private logger: Logger,
    private botId: string,
    private cache: ObjectCache,
    private database: Database
  ) {
    this._listenForCacheInvalidation()
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

    const actions: ActionDefinition[] = (
      await Promise.map(globalActionsFiles, async file => this.getActionDefinition(file, 'global', true))
    ).concat(await Promise.map(localActionsFiles, async file => this.getActionDefinition(file, 'local', true)))

    this._actionsCache = actions
    return actions
  }

  async hasAction(actionName: string): Promise<boolean> {
    const actions = await this.listActions()
    return !!actions.find(x => x.name === actionName)
  }

  async runAction(props: RunActionProps): Promise<any> {
    const { actionName, incomingEvent, actionArgs } = props
    // todo: fix this
    const actionServer: ActionServer = { baseUrl: 'http://localhost:4000' }

    process.ASSERT_LICENSED()

    if (yn(process.core_env.BP_EXPERIMENTAL_REQUIRE_BPFS)) {
      await this.checkActionRequires(actionName)
    }

    debug.forBot(incomingEvent.botId, 'run action', { actionName, incomingEvent, actionArgs })

    const { action, code, dirPath, lookups, trusted } = await this.getActionDetails(actionName)

    const _require = prepareRequire(dirPath, lookups)

    const api = await createForAction()

    const args = {
      bp: api,
      event: incomingEvent,
      user: incomingEvent.state.user,
      temp: incomingEvent.state.temp,
      session: incomingEvent.state.session,
      args: actionArgs,
      printObject: printObject,
      process: UntrustedSandbox.getSandboxProcessArgs()
    }

    try {
      let result
      if (trusted) {
        result = await this.runWithoutVm(code, args, _require)
      } else {
        if (actionServer) {
          const response = await this.runInActionServer({
            actionServer,
            actionName,
            actionArgs,
            botId: incomingEvent.botId,
            incomingEvent
          })
          result = response.result
          _.merge(incomingEvent, response.incomingEvent)
        } else {
          this.logger.warn('Running legacy JavaScript action. Please migrate to the new Action Server.')
          result = await this.runInVm(code, dirPath, args, _require)
        }
      }

      debug.forBot(incomingEvent.botId, 'done running', { result, actionName, actionArgs })

      return result
    } catch (err) {
      this.logger
        .forBot(this.botId)
        .attachError(err)
        .error(`An error occurred while executing the action "${actionName}`)
      throw new ActionExecutionError(err.message, actionName, err.stack)
    }
  }

  async runInVm(code: string, dirPath: string, args: any, _require: Function) {
    const modRequire = new Proxy(
      {},
      {
        get: (_obj, prop) => _require(prop)
      }
    )

    const vm = new NodeVM({
      wrapper: 'none',
      sandbox: args,
      require: {
        external: true,
        mock: modRequire
      },
      timeout: 5000
    })

    const runner = new VmRunner()
    return runner.runInVm(vm, code, dirPath)
  }

  async getActionDetails(actionName: string) {
    const action = await this.findAction(actionName)
    const code = await this.getActionScript(action)

    const botFolder = action.location === 'global' ? 'global' : 'bots/' + this.botId
    const dirPath = path.resolve(path.join(process.PROJECT_LOCATION, `/data/${botFolder}/actions/${actionName}.js`))
    const lookups = getBaseLookupPaths(dirPath)

    const trusted = this.isTrustedAction(actionName)
    return { code, dirPath, lookups, action, trusted }
  }

  private async runInActionServer(props: {
    actionServer: ActionServer
    actionName: string
    incomingEvent: IO.IncomingEvent
    actionArgs: any
    botId: string
  }): Promise<{ result: any; incomingEvent: IO.IncomingEvent }> {
    const { actionName, actionArgs, botId, actionServer, incomingEvent } = props

    const token = jsonwebtoken.sign({ botId, allowedScopes: [], workspace: '', taskId: '' }, process.APP_SECRET, {
      expiresIn: '15m'
    })

    const knex = this.database.knex('tasks')
    const taskId = (await knex.returning('id').insert({ eventId: incomingEvent.id, status: 'started' }))[0]
    const response = await axios.post(`${actionServer.baseUrl}/action/run`, {
      token,
      actionName,
      incomingEvent: props.incomingEvent,
      actionArgs,
      botId
    })

    await knex
      .where({ id: taskId })
      .update({ status: 'completed', response_status_code: response.status, updated_at: this.database.knex.date.now() })

    return { result: response.data.result, incomingEvent: response.data.incomingEvent }
  }

  private _listenForCacheInvalidation() {
    const clearDebounce = _.debounce(this._clearCache.bind(this), DEBOUNCE_DELAY, { leading: true, trailing: false })

    this.cache.events.on('invalidation', key => {
      if (key.toLowerCase().indexOf(`/actions`) > -1) {
        clearDebounce()
      }
    })
  }

  private _clearCache() {
    this._scriptsCache.clear()
    this._actionsCache = undefined
    this._validScripts = {}
  }

  private async getActionDefinition(
    file: string,
    location: ActionLocation,
    includeMetadata: boolean
  ): Promise<ActionDefinition> {
    let action: ActionDefinition = {
      name: file.replace(/\.js$/i, ''),
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

  private isTrustedAction(actionName: string): boolean {
    // TODO: find more scalable approach
    return ['analytics/increment', 'analytics/decrement', 'analytics/set'].includes(actionName)
  }

  // This method tries to load require() files from the FS and fallback on BPFS
  private async checkActionRequires(actionName: string): Promise<boolean> {
    if (this._validScripts[actionName]) {
      return true
    }

    const { code, dirPath: parentScript, lookups } = await this.getActionDetails(actionName)

    const isRequireValid = prepareRequireTester(parentScript, lookups)
    const files = extractRequiredFiles(code)

    for (const file of files) {
      if (isRequireValid(file)) {
        continue
      }

      try {
        // Ensures the required files are available before compiling the action
        await this.checkActionRequires(file)

        const { code, dirPath, lookups } = await this.getActionDetails(file)
        const exports = requireFromString(code, file, parentScript, prepareRequire(dirPath, lookups))

        if (_.isEmpty(exports)) {
          this.logger.warn(`Your required file (${file}) looks empty. Missing module.exports ? `)
        }
      } catch (err) {
        this.logger.attachError(err).error(`There is an issue with required file ${file}.js in action ${actionName}.js`)
        return false
      }
    }

    this._validScripts[actionName] = true
    return true
  }

  private async runWithoutVm(code: string, args: any, _require: Function) {
    args = {
      ...args,
      require: _require
    }

    const fn = new Function(...Object.keys(args), code)
    return fn(...Object.values(args))
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
