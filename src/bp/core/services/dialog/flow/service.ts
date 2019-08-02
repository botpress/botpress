import { Flow, FlowNode, Logger } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { ModuleLoader } from 'core/module-loader'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import nanoid from 'nanoid/generate'

import { FlowView, NodeView } from '..'
import { GhostService } from '../..'
import { TYPES } from '../../../types'
import { validateFlowSchema } from '../validator'

import { RealTimePayload } from 'core/sdk/impl'
import RealtimeService from 'core/services/realtime'
import { KeyValueStore } from 'core/services/kvs'
import moment = require('moment')

const PLACING_STEP = 250
const MIN_POS_X = 50
const FLOW_DIR = 'flows'

const MUTEX_LOCK_DELAY_SECONDS = 30

interface FlowModification {
  name: string
  botId: string
  userEmail: string
  modification: 'rename' | 'delete' | 'create' | 'update'
  newName?: string
  payload?: any
}

interface FlowMutex {
  lastModifiedBy: string
  lastModifiedAt: Date
  remainingSeconds?: number // backend calculate this because all clients time might be wrong
}

export class MutexError extends Error {
  type = MutexError.name
}

interface MutexableFlowView extends FlowView {
  currentMutex: FlowMutex
}

@injectable()
export class FlowService {
  private _allFlows: Map<string, MutexableFlowView[]> = new Map()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.RealtimeService) private realtime: RealtimeService,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore
  ) {
    this._listenForCacheInvalidation()
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', (key: string) => {
      const matches = key.match(/\/bots\/([A-Z0-9-_]+)\/flows\//i)
      if (matches && matches.length >= 1) {
        const botId = matches[1]
        if (this._allFlows.has(botId)) {
          this._allFlows.delete(botId)
        }
      }
    })
  }

  async loadAll(botId: string): Promise<MutexableFlowView[]> {
    if (this._allFlows.has(botId)) {
      return this._allFlows.get(botId)!
    }

    const flowsPath = this.ghost.forBot(botId).directoryListing(FLOW_DIR, '*.flow.json')

    try {
      const flows = await Promise.map(flowsPath, async (flowPath: string) => {
        return this.parseFlow(botId, flowPath)
      })

      this._allFlows.set(botId, flows)
      return flows
    } catch (err) {
      this.logger
        .forBot(botId)
        .attachError(err)
        .error('Could not load flows')
      return []
    }
  }

  private async parseFlow(botId: string, flowPath: string): Promise<MutexableFlowView> {
    const flow = await this.ghost.forBot(botId).readFileAsObject<Flow>(FLOW_DIR, flowPath)
    const schemaError = validateFlowSchema(flow)

    if (!flow || schemaError) {
      throw new Error(`Invalid schema for "${flowPath}". ` + schemaError)
    }

    const uiEq = await this.ghost.forBot(botId).readFileAsObject<FlowView>(FLOW_DIR, this.uiPath(flowPath))
    let unplacedIndex = -1

    const nodeViews = flow.nodes.map(node => {
      const position = _.get(_.find(uiEq.nodes, { id: node.id }), 'position')
      unplacedIndex = position ? unplacedIndex : unplacedIndex + 1
      return <NodeView>{
        ...node,
        x: position ? position.x : MIN_POS_X + unplacedIndex * PLACING_STEP,
        y: position ? position.y : (_.maxBy(flow.nodes, 'y') || { y: 0 })['y'] + PLACING_STEP
      }
    })

    let currentMutex = (await this.kvs.get(botId, flowPath)) as FlowMutex
    if (currentMutex) {
      currentMutex = this._setRemainingSeconds(currentMutex)
    }

    return {
      name: flowPath,
      location: flowPath,
      nodes: nodeViews,
      links: uiEq.links,
      version: flow.version,
      catchAll: flow.catchAll,
      startNode: flow.startNode,
      skillData: flow.skillData,
      currentMutex
    }
  }

  private _setRemainingSeconds(currentMutex) {
    const now = moment()
    const freeTime = moment(currentMutex.lastModifiedAt).add(MUTEX_LOCK_DELAY_SECONDS, 'seconds')
    const remainingSeconds = now.unix() >= freeTime.unix() ? 0 : Math.ceil(Math.abs(now.diff(freeTime, 'seconds')))
    currentMutex = {
      ...currentMutex,
      remainingSeconds
    }
    return currentMutex
  }

  async insertFlow(botId: string, flow: FlowView, userEmail: string) {
    let currentMutex = await this._testAndLockMutex(botId, userEmail, flow.location || flow.name)

    const ghost = this.ghost.forBot(botId)

    const flowFiles = await ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToCreate = flowFiles.find(f => f === flow.name)
    if (fileToCreate) {
      throw new Error(`Can not create an already existant flow : ${flow.name}`)
    }

    await this._upsertFlow(botId, flow)

    currentMutex = this._setRemainingSeconds(currentMutex)
    const mutexableFlow: MutexableFlowView = { ...flow, currentMutex }

    this.notifyChanges({
      botId,
      name: flow.name,
      modification: 'create',
      payload: mutexableFlow,
      userEmail
    })
  }

  async updateFlow(botId: string, flow: FlowView, userEmail: string) {
    let currentMutex = await this._testAndLockMutex(botId, userEmail, flow.location || flow.name)

    await this._upsertFlow(botId, flow)

    currentMutex = this._setRemainingSeconds(currentMutex)
    const mutexableFlow: MutexableFlowView = { ...flow, currentMutex }

    this.notifyChanges({
      name: flow.name,
      botId,
      modification: 'update',
      payload: mutexableFlow,
      userEmail
    })
  }

  private async _upsertFlow(botId: string, flow: FlowView) {
    process.ASSERT_LICENSED()

    const ghost = this.ghost.forBot(botId)

    const flowFiles = await ghost.directoryListing(FLOW_DIR, '**/*.json')

    const isNew = !flowFiles.find(x => flow.location === x)
    const { flowPath, uiPath, flowContent, uiContent } = await this.prepareSaveFlow(botId, flow, isNew)

    await Promise.all([
      ghost.upsertFile(FLOW_DIR, flowPath, JSON.stringify(flowContent, undefined, 2)),
      ghost.upsertFile(FLOW_DIR, uiPath, JSON.stringify(uiContent, undefined, 2))
    ])

    this._allFlows.clear()
  }

  async deleteFlow(botId: string, flowName: string, userEmail: string) {
    process.ASSERT_LICENSED()

    const ghost = this.ghost.forBot(botId)

    const flowFiles = await ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToDelete = flowFiles.find(f => f === flowName)
    if (!fileToDelete) {
      throw new Error(`Can not delete a flow that does not exist: ${flowName}`)
    }

    const uiPath = this.uiPath(fileToDelete)
    await Promise.all([ghost.deleteFile(FLOW_DIR, fileToDelete!), ghost.deleteFile(FLOW_DIR, uiPath)])

    this._allFlows.clear()

    this.notifyChanges({
      name: flowName,
      botId,
      modification: 'delete',
      userEmail
    })
  }

  async renameFlow(botId: string, previousName: string, newName: string, userEmail: string) {
    process.ASSERT_LICENSED()

    const ghost = this.ghost.forBot(botId)

    const flowFiles = await ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToRename = flowFiles.find(f => f === previousName)
    if (!fileToRename) {
      throw new Error(`Can not rename a flow that does not exist: ${previousName}`)
    }

    const previousUiName = this.uiPath(fileToRename)
    const newUiName = this.uiPath(newName)
    await Promise.all([
      ghost.renameFile(FLOW_DIR, fileToRename!, newName),
      ghost.renameFile(FLOW_DIR, previousUiName, newUiName)
    ])
    this._allFlows.clear()

    this.notifyChanges({
      name: previousName,
      botId,
      modification: 'rename',
      newName: newName,
      userEmail
    })
  }

  private notifyChanges = (modification: FlowModification) => {
    const payload = RealTimePayload.forAdmins('flow.changes', modification)
    this.realtime.sendToSocket(payload)
  }

  private async _testAndLockMutex(botId: string, currentFlowEditor: string, flowLocation: string): Promise<FlowMutex> {
    const currentMutex = ((await this.kvs.get(botId, flowLocation)) || {}) as FlowMutex
    let { lastModifiedBy: flowOwner, lastModifiedAt } = currentMutex

    // TODO: might use somthing else than flowLocation as key. Maybe something like `FLOWMUTEX: ${flowLocation}`
    if (currentFlowEditor === flowOwner) {
      const mutex = { lastModifiedBy: flowOwner, lastModifiedAt: new Date() }
      await this.kvs.set(botId, flowLocation, mutex)
      return mutex
    }

    const isMutexExpired =
      moment(lastModifiedAt)
        .add(MUTEX_LOCK_DELAY_SECONDS, 'seconds')
        .unix() < moment().unix()
    if (!flowOwner || isMutexExpired) {
      const mutex = { lastModifiedBy: currentFlowEditor, lastModifiedAt: new Date() }
      await this.kvs.set(botId, flowLocation, mutex)
      return mutex
    }

    throw new Error('Flow is currently locked by someone else')
  }

  async createMainFlow(botId: string) {
    const defaultNode: NodeView = {
      name: 'entry',
      id: nanoid('1234567890', 6),
      onEnter: [],
      onReceive: eval('null'),
      next: [],
      x: 100,
      y: 100
    }

    const flow: FlowView = {
      version: '0.0',
      name: 'main.flow.json',
      location: 'main.flow.json',
      catchAll: {},
      startNode: defaultNode.name,
      nodes: [defaultNode],
      links: []
    }

    return this._upsertFlow(botId, flow)
  }

  private async prepareSaveFlow(botId, flow, isNew: boolean) {
    const schemaError = validateFlowSchema(flow)
    if (schemaError) {
      throw new Error(schemaError)
    }

    if (!isNew) {
      await this.moduleLoader.onFlowChanged(botId, flow)
    }

    const uiContent = {
      nodes: flow.nodes.map(node => ({ id: node.id, position: _.pick(node, 'x', 'y') })),
      links: flow.links
    }

    const flowContent = {
      ..._.pick(flow, 'version', 'catchAll', 'startNode', 'skillData'),
      nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
    }

    const flowPath = flow.location
    return { flowPath, uiPath: this.uiPath(flowPath), flowContent, uiContent }
  }

  private uiPath(flowPath) {
    return flowPath.replace(/\.flow\.json/i, '.ui.json')
  }
}
