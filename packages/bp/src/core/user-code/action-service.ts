import axios from 'axios'
import { IO, Logger } from 'botpress/sdk'
import { extractEventCommonArgs } from 'common/action'
import { ObjectCache } from 'common/object-cache'
import { ActionScope, ActionServer, LocalActionDefinition } from 'common/typings'
import { createForAction } from 'core/app/api'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { ActionExecutionError } from 'core/dialog/errors'
import { addErrorToEvent, addStepToEvent, StepScopes, StepStatus } from 'core/events'
import { UntrustedSandbox } from 'core/misc/code-sandbox'
import { printObject } from 'core/misc/print'
import { clearRequireCache, requireFromString } from 'core/modules'
import { NotFoundError } from 'core/routers/errors'
import { ACTION_SERVER_AUDIENCE } from 'core/routers/sdk/utils'
import { TYPES } from 'core/types'
import { WorkspaceService } from 'core/users'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import jsonwebtoken from 'jsonwebtoken'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'
import { NodeVM } from 'vm2'
import yn from 'yn'

import { TasksRepository } from './action-server/tasks-repository'
import { extractMetadata } from './metadata'
import {
  enabled,
  extractRequiredFiles,
  getBaseLookupPaths,
  isTrustedAction,
  prepareRequire,
  prepareRequireTester,
  runOutsideVm
} from './utils'
import { VmRunner } from './vm'

const debug = DEBUG('actions')
const DEBOUNCE_DELAY = ms('2s')

// node_production_modules are node_modules that are compressed for production
const EXCLUDES = ['**/node_modules/**', '**/node_production_modules/**']

export type RunType = 'trusted' | 'legacy' | 'http'

export interface ActionServerResponse {
  event: { state: Pick<IO.EventState, 'temp' | 'user' | 'session'> }
}

const ACTION_SERVER_RESPONSE_SCHEMA = joi.object({
  event: joi.object({ state: joi.object({ temp: joi.object(), session: joi.object(), user: joi.object() }) })
})

@injectable()
export class ActionService {
  private _scopedActions: Map<string, Promise<ScopedActionService>> = new Map()
  private _invalidateDebounce

  constructor(
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.TasksRepository) private tasksRepository: TasksRepository,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.Logger)
    @tagged('name', 'ActionService')
    private logger: Logger
  ) {
    this._listenForCacheInvalidation()
    this._invalidateDebounce = _.debounce(this._invalidateRequire, DEBOUNCE_DELAY, { leading: true, trailing: false })
  }

  public async forBot(botId: string): Promise<ScopedActionService> {
    if (this._scopedActions.has(botId)) {
      return this._scopedActions.get(botId)!
    }

    const service = new Promise<ScopedActionService>(async cb => {
      if (!(await this.botService.botExists(botId, true))) {
        throw new NotFoundError('This bot does not exist')
      }

      const workspaceId = await this.workspaceService.getBotWorkspaceId(botId)
      cb(new ScopedActionService(this.ghost, this.logger, botId, this.cache, this.tasksRepository, workspaceId))
    })

    this._scopedActions.set(botId, service)
    return service
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', key => {
      if (key.toLowerCase().indexOf('/actions') > -1 || key.toLowerCase().indexOf('/libraries') > -1) {
        this._invalidateDebounce(key)
      }
    })
  }

  // Debouncing invalidate since we get a lot of events when it happens
  private _invalidateRequire() {
    Object.keys(require.cache)
      .filter(r => r.match(/(\\|\/)(actions|shared_libs|libraries)(\\|\/)/g))
      .map(file => delete require.cache[file])

    clearRequireCache()
  }
}

export interface RunActionProps {
  actionName: string
  incomingEvent: IO.IncomingEvent
  actionArgs: any
}

export class ScopedActionService {
  private _globalActionsCache: LocalActionDefinition[] | undefined
  private _localActionsCache: LocalActionDefinition[] | undefined
  private _scriptsCache: Map<string, string> = new Map()
  // Keeps a quick index of files which have already been required
  private _validScripts: { [filename: string]: boolean } = {}

  constructor(
    private ghost: GhostService,
    private logger: Logger,
    private botId: string,
    private cache: ObjectCache,
    private tasksRepository: TasksRepository,
    private workspaceId: string
  ) {
    this._listenForCacheInvalidation()
  }

  async listActions(): Promise<LocalActionDefinition[]> {
    const globalActions = await this._listGlobalActions()
    const localActions = await this.listLocalActions()

    return globalActions.concat(localActions)
  }

  async hasAction(actionName: string): Promise<boolean> {
    const actions = await this.listActions()
    return !!actions.find(x => x.name === actionName)
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

  async runAction(props: RunActionProps & { actionServer?: ActionServer }): Promise<void> {
    const { actionName, actionArgs, actionServer, incomingEvent } = props
    process.ASSERT_LICENSED?.()

    debug.forBot(incomingEvent.botId, 'run action', { actionName, incomingEvent, actionArgs })

    try {
      if (actionServer) {
        await this._runInActionServer({ ...props, actionServer })
      } else {
        await this.runLocalAction({
          actionName,
          actionArgs,
          incomingEvent,
          runType: isTrustedAction(actionName) ? 'trusted' : 'legacy'
        })
      }

      debug.forBot(incomingEvent.botId, 'done running', { actionName, actionArgs })
      addStepToEvent(incomingEvent, StepScopes.Action, actionName, StepStatus.Completed)
    } catch (err) {
      this.logger
        .forBot(this.botId)
        .attachError(err)
        .error(`An error occurred while executing the action "${actionName}`)

      addErrorToEvent(
        {
          type: 'action-execution',
          stacktrace: err.stacktrace || err.stack,
          actionName,
          actionArgs: _.omit(actionArgs, ['event'])
        },
        incomingEvent
      )
      const name = actionName ?? incomingEvent.state.context?.currentNode ?? ''
      addStepToEvent(incomingEvent, StepScopes.Action, name, StepStatus.Error)
      throw new ActionExecutionError(err.message, name, err.stack)
    }
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

  private async _runInActionServer(props: RunActionProps & { actionServer: ActionServer }): Promise<void> {
    const { actionName, actionArgs, actionServer, incomingEvent } = props
    const botId = incomingEvent.botId

    const token = jsonwebtoken.sign({ botId, scopes: ['*'], workspaceId: this.workspaceId }, process.APP_SECRET, {
      expiresIn: '5m',
      audience: ACTION_SERVER_AUDIENCE
    })

    const taskInfo: any = {
      eventId: incomingEvent.id,
      actionName,
      actionArgs,
      actionServerId: actionServer.id,
      startedAt: new Date()
    }

    let response
    try {
      response = await axios({
        method: 'post',
        url: `${actionServer.baseUrl}/action/run`,
        timeout: ms('5s'),
        data: { token, botId, ..._.omit(props, ['actionServer']) },
        // I override validateStatus in order for axios to not throw the Action Server returns a 500 error.
        // See https://github.com/axios/axios/issues/1143#issuecomment-340331822
        validateStatus: status => {
          return true
        }
      })
    } catch (e) {
      if (e.isAxiosError) {
        this.tasksRepository.createTask({
          ...taskInfo,
          endedAt: new Date(),
          status: 'failed',
          failureReason: `http:${e.code}`
        })
      }

      throw e
    }

    const statusCode = response.status
    taskInfo.endedAt = new Date()
    taskInfo.statusCode = statusCode

    if (statusCode !== 200) {
      this.tasksRepository.createTask({
        ...taskInfo,
        status: 'failed',
        failureReason: 'http:bad_status_code'
      })
      return
    }

    const { error } = joi.validate(response.data, ACTION_SERVER_RESPONSE_SCHEMA)
    if (error) {
      this.tasksRepository.createTask({
        ...taskInfo,
        status: 'failed',
        failureReason: `validation:${error.name}`
      })

      throw error
    }

    const { temp, user, session } = (response.data as ActionServerResponse).event.state

    incomingEvent.state.temp = { responseStatusCode: statusCode, ...temp }
    incomingEvent.state.user = user
    incomingEvent.state.session = session

    this.tasksRepository.createTask({
      ...taskInfo,
      status: 'completed'
    })
  }

  public async runLocalAction(
    props: RunActionProps & {
      token?: string
      runType: RunType
    }
  ) {
    const { actionName, actionArgs, incomingEvent, runType } = props

    const { code, _require, dirPath, action } = await this.loadLocalAction(actionName)

    const args = extractEventCommonArgs(incomingEvent, {
      args: actionArgs,
      printObject,
      process: UntrustedSandbox.getSandboxProcessArgs()
    })

    switch (runType) {
      case 'trusted': {
        // bp is created here because it cannot be created in the Local Action Server thread
        return this._runWithoutVm(code, { bp: await createForAction(), ...args }, _require)
      }
      case 'legacy': {
        if (runOutsideVm(action.scope)) {
          return this._runWithoutVm(code, { bp: await createForAction(), ...args }, _require)
        }
        // bp is created here because it cannot be created in the Local Action Server thread
        return this._runInVm(code, dirPath, { bp: await createForAction(), ...args }, _require)
      }
      case 'http': {
        return this._runInVm(code, dirPath, { token: props.token, ...args }, _require)
      }
      default: {
        throw `Unexpected runType: ${runType}`
      }
    }
  }

  private async _runInVm(code: string, dirPath: string, args: any, _require: Function) {
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

  private async _getActionDetails(actionName: string) {
    const action = await this._findAction(actionName)
    const code = await this._getActionScript(action.name, action.scope, action.legacy)

    const botFolder = action.scope === 'global' ? 'global' : `bots/${this.botId}`
    const dirPath = path.resolve(path.join(process.PROJECT_LOCATION, `/data/${botFolder}/actions/${actionName}.js`))
    const lookups = getBaseLookupPaths(dirPath, 'actions', this.botId)

    return { code, dirPath, lookups, action }
  }

  public async loadLocalAction(actionName: string) {
    if (yn(process.core_env.BP_EXPERIMENTAL_REQUIRE_BPFS)) {
      await this._checkActionRequires(actionName)
    }

    const { code, dirPath, lookups, action } = await this._getActionDetails(actionName)

    const _require = prepareRequire(dirPath, lookups)

    return { code, _require, dirPath, action }
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
    this._validScripts = {}
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

  // This method tries to load require() files from the FS and fallback on BPFS
  private async _checkActionRequires(actionName: string): Promise<boolean> {
    if (this._validScripts[actionName]) {
      return true
    }

    const { code, dirPath: parentScript, lookups } = await this._getActionDetails(actionName)

    const isRequireValid = prepareRequireTester(parentScript, lookups)
    const files = extractRequiredFiles(code)

    for (const file of files) {
      if (isRequireValid(file)) {
        continue
      }

      try {
        // Ensures the required files are available before compiling the action
        await this._checkActionRequires(file)

        const { code, dirPath, lookups } = await this._getActionDetails(file)
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

  private async _runWithoutVm(code: string, args: any, _require: Function) {
    args = {
      ...args,
      require: _require
    }

    const fn = new Function(...Object.keys(args), code)
    return fn(...Object.values(args))
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
