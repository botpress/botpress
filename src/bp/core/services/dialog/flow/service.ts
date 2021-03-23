import { Flow, Logger, ScopedGhostService } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { TreeSearch, PATH_SEPARATOR } from 'common/treeSearch'
import { FlowMutex, FlowView, NodeView } from 'common/typings'
import { TYPES } from 'core/app/types'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { KeyValueStore, KvsService } from 'core/kvs'
import { ModuleLoader } from 'core/modules'
import { RealtimeService, RealTimePayload } from 'core/realtime'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import nanoid from 'nanoid/generate'

import { validateFlowSchema } from '../validator'

const PLACING_STEP = 250
const MIN_POS_X = 50
const FLOW_DIR = 'flows'

const MUTEX_LOCK_DELAY_SECONDS = 30

export const TopicSchema = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string()
    .optional()
    .allow('')
})

interface FlowModification {
  name: string
  botId: string
  userEmail: string
  modification: 'rename' | 'delete' | 'create' | 'update'
  newName?: string
  payload?: any
}

interface Topic {
  name: string
  description: string
}

export class MutexError extends Error {
  type = MutexError.name
}

class FlowCache {
  private _flows: Map<string, Map<string, FlowView>> = new Map()

  public set(botId: string, flowViews: FlowView[]): void {
    const flows = new Map(flowViews.map(f => [f.name, f]))
    this._flows.set(botId, flows)
  }

  public get(botId: string): FlowView[] {
    if (this._flows.has(botId)) {
      return Array.from(this._flows.get(botId)!.values())
    } else {
      return []
    }
  }

  public has(botId: string): boolean {
    return this._flows.has(botId)
  }

  public isEmpty(): boolean {
    return this._flows.size === 0
  }

  public upsertFlow(botId: string, flow: FlowView): void {
    if (this._flows.has(botId)) {
      this._flows.get(botId)!.set(flow.name, flow)
    }
  }

  public deleteFlow(botId: string, flowName: string): void {
    if (this._flows.has(botId)) {
      this._flows.get(botId)!.delete(flowName)
    }
  }

  public renameFlow(botId: string, oldName: string, newName: string): void {
    if (this._flows.has(botId) && this._flows.get(botId)!.has(oldName)) {
      const flow = this._flows.get(botId)!.get(oldName)!
      flow.name = newName

      this.upsertFlow(botId, flow)
      this.deleteFlow(botId, oldName)
    }
  }
}

@injectable()
export class FlowService {
  private scopes: { [botId: string]: ScopedFlowService } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.RealtimeService) private realtime: RealtimeService,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore,
    @inject(TYPES.BotService) private botService: BotService
  ) {
    this._listenForCacheInvalidation()
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', async (key: string) => {
      const matches = key.match(/object::[\s\S]+\/bots\/([A-Z0-9-_]+)\/flows\/([\s\S]+(flow|ui)\.json)/i)

      if (matches && matches.length >= 2) {
        const [key, botId, flowName] = matches
        await this.forBot(botId).handleInvalidatedCache(flowName)
      }
    })
  }

  public forBot(botId: string): ScopedFlowService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedFlowService(
        botId,
        this.ghost.forBot(botId),
        this.kvs.forBot(botId),
        this.logger,
        this.moduleLoader,
        this.realtime,
        this.botService
      )
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedFlowService {
  private _flowCache: FlowCache = new FlowCache()

  constructor(
    private botId: string,
    private ghost: ScopedGhostService,
    private kvs: KvsService,
    private logger: Logger,
    private moduleLoader: ModuleLoader,
    private realtime: RealtimeService,
    private botService: BotService
  ) {}

  async handleInvalidatedCache(flowName: string) {
    if (this._flowCache.isEmpty()) {
      return
    }

    const flowPath = this.toFlowPath(flowName)

    if (await this.ghost.fileExists(FLOW_DIR, flowPath)) {
      const flow = await this.parseFlow(flowPath)

      this._flowCache.upsertFlow(this.botId, flow)
    } else {
      this._flowCache.deleteFlow(this.botId, flowPath)
    }

    // parent flows are only used by the NDU
    if (this._isOneFlow()) {
      const flows = this._flowCache.get(this.botId)
      const flowsWithParents = this.addParentsToFlows(flows)

      this._flowCache.set(this.botId, flowsWithParents)
    }
  }

  async loadAll(): Promise<FlowView[]> {
    if (this._flowCache.has(this.botId)) {
      return this._flowCache.get(this.botId)!
    }

    const flowsPath = this.ghost.directoryListing(FLOW_DIR, '*.flow.json', undefined, undefined, {
      sortOrder: { column: 'filePath' }
    })

    try {
      const flows = await Promise.map(flowsPath, async (flowPath: string) => {
        return this.parseFlow(flowPath)
      })

      // parent flows are only used by the NDU
      if (this._isOneFlow()) {
        const flowsWithParents = this.addParentsToFlows(flows)
        this._flowCache.set(this.botId, flowsWithParents)

        return flowsWithParents
      } else {
        this._flowCache.set(this.botId, flows)

        return flows
      }
    } catch (err) {
      this.logger
        .forBot(this.botId)
        .attachError(err)
        .error('Could not load flows')
      return []
    }
  }

  @Memoize()
  private async _isOneFlow(): Promise<boolean> {
    const botConfig = await this.botService.findBotById(this.botId)
    return !!botConfig?.oneflow
  }

  private addParentsToFlows(flows: FlowView[]): FlowView[] {
    const tree = new TreeSearch(PATH_SEPARATOR)

    flows.forEach(f => {
      const filename = f.name.replace('.flow.json', '')
      // the value we are looking for is the parent filename
      tree.insert(filename, filename)
    })

    return flows.map(f => {
      const filename = f.name.replace('.flow.json', '')

      return {
        ...f,
        parent: tree.getParent(filename)
      }
    })
  }

  private async parseFlow(flowPath: string): Promise<FlowView> {
    const flow = await this.ghost.readFileAsObject<Flow>(FLOW_DIR, flowPath)
    const schemaError = validateFlowSchema(flow, await this._isOneFlow())

    if (!flow || schemaError) {
      throw new Error(`Invalid schema for "${flowPath}". ${schemaError} `)
    }

    const uiEq = await this.ghost.readFileAsObject<FlowView>(FLOW_DIR, this.toUiPath(flowPath))
    let unplacedIndex = -1

    const nodeViews: NodeView[] = flow.nodes.map(node => {
      const position = _.get(_.find(uiEq.nodes, { id: node.id }), 'position')
      unplacedIndex = position ? unplacedIndex : unplacedIndex + 1
      return {
        ...node,
        x: position ? position.x : MIN_POS_X + unplacedIndex * PLACING_STEP,
        y: position ? position.y : (_.maxBy(flow.nodes, 'y') || { y: 0 })['y'] + PLACING_STEP
      }
    })

    const key = this._buildFlowMutexKey(flowPath)
    const currentMutex = (await this.kvs.get(key)) as FlowMutex
    if (currentMutex) {
      currentMutex.remainingSeconds = this._getRemainingSeconds(currentMutex.lastModifiedAt)
    }

    return {
      name: flowPath,
      location: flowPath,
      nodes: nodeViews,
      links: uiEq.links,
      currentMutex,
      ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'label', 'description'])
    }
  }

  private _getRemainingSeconds(lastModifiedAt: Date): number {
    const now = moment()
    const freeTime = moment(lastModifiedAt).add(MUTEX_LOCK_DELAY_SECONDS, 'seconds')
    return Math.ceil(Math.max(0, freeTime.diff(now, 'seconds')))
  }

  async insertFlow(flow: FlowView, userEmail: string) {
    const flowFiles = await this.ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToCreate = flowFiles.find(f => f === flow.name)
    if (fileToCreate) {
      throw new Error(`Can not create an already existent flow : ${flow.name}`)
    }

    await this._upsertFlow(flow)

    const currentMutex = await this._testAndLockMutex(userEmail, flow.location || flow.name)
    const mutexFlow: FlowView = { ...flow, currentMutex }

    this.notifyChanges({
      botId: this.botId,
      name: flow.name,
      modification: 'create',
      payload: mutexFlow,
      userEmail
    })
  }

  async updateFlow(flow: FlowView, userEmail: string) {
    const currentMutex = await this._testAndLockMutex(userEmail, flow.location || flow.name)

    await this._upsertFlow(flow)

    const mutexFlow: FlowView = { ...flow, currentMutex }

    this.notifyChanges({
      name: flow.name,
      botId: this.botId,
      modification: 'update',
      payload: mutexFlow,
      userEmail
    })
  }

  private async _upsertFlow(flow: FlowView) {
    process.ASSERT_LICENSED()

    const flowFiles = await this.ghost.directoryListing(FLOW_DIR, '**/*.json')

    const isNew = !flowFiles.find(x => flow.location === x)
    const { flowPath, uiPath, flowContent, uiContent } = await this.prepareSaveFlow(flow, isNew)

    await Promise.all([
      this.ghost.upsertFile(FLOW_DIR, flowPath!, JSON.stringify(flowContent, undefined, 2)),
      this.ghost.upsertFile(FLOW_DIR, uiPath, JSON.stringify(uiContent, undefined, 2))
    ])

    this._flowCache.upsertFlow(this.botId, flow)
  }

  async deleteFlow(flowName: string, userEmail: string) {
    process.ASSERT_LICENSED()

    const flowFiles = await this.ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToDelete = flowFiles.find(f => f === flowName)
    if (!fileToDelete) {
      throw new Error(`Can not delete a flow that does not exist: ${flowName}`)
    }

    const uiPath = this.toUiPath(fileToDelete)
    await Promise.all([this.ghost.deleteFile(FLOW_DIR, fileToDelete!), this.ghost.deleteFile(FLOW_DIR, uiPath)])

    this._flowCache.deleteFlow(this.botId, flowName)

    this.notifyChanges({
      name: flowName,
      botId: this.botId,
      modification: 'delete',
      userEmail
    })
  }

  async renameFlow(previousName: string, newName: string, userEmail: string) {
    process.ASSERT_LICENSED()

    const flowFiles = await this.ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToRename = flowFiles.find(f => f === previousName)
    if (!fileToRename) {
      throw new Error(`Can not rename a flow that does not exist: ${previousName}`)
    }

    const previousUiName = this.toUiPath(fileToRename)
    const newUiName = this.toUiPath(newName)
    await Promise.all([
      this.ghost.renameFile(FLOW_DIR, fileToRename!, newName),
      this.ghost.renameFile(FLOW_DIR, previousUiName, newUiName)
    ])

    this._flowCache.renameFlow(this.botId, previousName, newName)

    await this.moduleLoader.onFlowRenamed(this.botId, previousName, newName)

    this.notifyChanges({
      name: previousName,
      botId: this.botId,
      modification: 'rename',
      newName,
      userEmail
    })
  }

  private notifyChanges = (modification: FlowModification) => {
    const payload = RealTimePayload.forAdmins('flow.changes', modification)
    this.realtime.sendToSocket(payload)
  }

  private _buildFlowMutexKey(flowLocation: string): string {
    return `FLOWMUTEX: ${flowLocation}`
  }

  private async _testAndLockMutex(currentFlowEditor: string, flowLocation: string): Promise<FlowMutex> {
    const key = this._buildFlowMutexKey(flowLocation)

    const currentMutex = ((await this.kvs.get(key)) || {}) as FlowMutex
    const { lastModifiedBy: flowOwner, lastModifiedAt } = currentMutex

    const now = new Date()
    const remainingSeconds = this._getRemainingSeconds(now)

    if (currentFlowEditor === flowOwner) {
      const mutex: FlowMutex = {
        lastModifiedBy: flowOwner,
        lastModifiedAt: now
      }
      await this.kvs.set(key, mutex)

      mutex.remainingSeconds = remainingSeconds
      return mutex
    }

    const isMutexExpired = !this._getRemainingSeconds(lastModifiedAt)
    if (!flowOwner || isMutexExpired) {
      const mutex: FlowMutex = {
        lastModifiedBy: currentFlowEditor,
        lastModifiedAt: now
      }
      await this.kvs.set(key, mutex)

      mutex.remainingSeconds = remainingSeconds
      return mutex
    }

    throw new MutexError('Flow is currently locked by someone else')
  }

  async createMainFlow() {
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

    return this._upsertFlow(flow)
  }

  private async prepareSaveFlow(flow: FlowView, isNew: boolean) {
    const schemaError = validateFlowSchema(flow, await this._isOneFlow())
    if (schemaError) {
      throw new Error(schemaError)
    }

    if (!isNew) {
      await this.moduleLoader.onFlowChanged(this.botId, flow)
    }

    const uiContent = {
      nodes: flow.nodes.map(node => ({ id: node.id, position: _.pick(node, 'x', 'y') })),
      links: flow.links
    }

    const flowContent = {
      // TODO: NDU Remove triggers
      ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'triggers', 'label', 'description']),
      nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
    }

    const flowPath = flow.location
    return { flowPath, uiPath: this.toUiPath(flowPath!), flowContent, uiContent }
  }

  private toUiPath(flowPath: string) {
    return flowPath.replace(/\.flow\.json$/i, '.ui.json')
  }

  private toFlowPath(uiPath: string) {
    return uiPath.replace(/\.ui\.json$/i, '.flow.json')
  }

  public async getTopics(): Promise<Topic[]> {
    if (await this.ghost.fileExists('ndu', 'topics.json')) {
      const topics: any = this.ghost.readFileAsObject('ndu', 'topics.json')
      return topics
    }
    return []
  }

  public async deleteTopic(topicName: string) {
    let topics = await this.getTopics()
    topics = topics.filter(x => x.name !== topicName)

    await this.ghost.upsertFile('ndu', 'topics.json', JSON.stringify(topics, undefined, 2))
    await this.moduleLoader.onTopicChanged(this.botId, topicName, undefined)
  }

  public async createTopic(topic: Topic) {
    let topics = await this.getTopics()
    topics = _.uniqBy([...topics, topic], x => x.name)

    await this.ghost.upsertFile('ndu', 'topics.json', JSON.stringify(topics, undefined, 2))
    await this.moduleLoader.onTopicChanged(this.botId, undefined, topic.name)
  }

  public async updateTopic(topic: Topic, topicName: string) {
    let topics = await this.getTopics()
    topics = _.uniqBy([...topics.filter(x => x.name !== topicName), topic], x => x.name)

    await this.ghost.upsertFile('ndu', 'topics.json', JSON.stringify(topics, undefined, 2))

    if (topicName !== topic.name) {
      await this.moduleLoader.onTopicChanged(this.botId, topicName, topic.name)

      const flows = await this.loadAll()

      for (const flow of flows.filter(f => f.name.startsWith(`${topicName}/`))) {
        await this.renameFlow(flow.name, flow.name.replace(`${topicName}/`, `${topic.name}/`), 'server')
      }
    }
  }
}
