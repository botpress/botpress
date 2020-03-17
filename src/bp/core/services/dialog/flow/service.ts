import { Flow, Logger } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { FlowMutex, FlowView, NodeView } from 'common/typings'
import { ModuleLoader } from 'core/module-loader'
import { RealTimePayload } from 'core/sdk/impl'
import { BotService } from 'core/services/bot-service'
import { KeyValueStore } from 'core/services/kvs'
import RealtimeService from 'core/services/realtime'
import { inject, injectable, tagged } from 'inversify'
import Joi from 'joi'
import _ from 'lodash'
import moment from 'moment'
import nanoid from 'nanoid/generate'

import { GhostService } from '../..'
import { TYPES } from '../../../types'
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

@injectable()
export class FlowService {
  private _allFlows: Map<string, FlowView[]> = new Map()

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

  async loadAll(botId: string): Promise<FlowView[]> {
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

  private async _isOneFlow(botId: string): Promise<boolean> {
    const botConfig = await this.botService.findBotById(botId)
    return !!botConfig?.oneflow
  }

  private async parseFlow(botId: string, flowPath: string): Promise<FlowView> {
    const flow = await this.ghost.forBot(botId).readFileAsObject<Flow>(FLOW_DIR, flowPath)
    const schemaError = validateFlowSchema(flow, await this._isOneFlow(botId))

    if (!flow || schemaError) {
      throw new Error(`Invalid schema for "${flowPath}". ` + schemaError)
    }

    const uiEq = await this.ghost.forBot(botId).readFileAsObject<FlowView>(FLOW_DIR, this.uiPath(flowPath))
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
    const currentMutex = (await this.kvs.forBot(botId).get(key)) as FlowMutex
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

  async insertFlow(botId: string, flow: FlowView, userEmail: string) {
    const ghost = this.ghost.forBot(botId)

    const flowFiles = await ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToCreate = flowFiles.find(f => f === flow.name)
    if (fileToCreate) {
      throw new Error(`Can not create an already existent flow : ${flow.name}`)
    }

    await this._upsertFlow(botId, flow)

    const currentMutex = await this._testAndLockMutex(botId, userEmail, flow.location || flow.name)
    const mutexFlow: FlowView = { ...flow, currentMutex }

    this.notifyChanges({
      botId,
      name: flow.name,
      modification: 'create',
      payload: mutexFlow,
      userEmail
    })
  }

  async updateFlow(botId: string, flow: FlowView, userEmail: string) {
    const currentMutex = await this._testAndLockMutex(botId, userEmail, flow.location || flow.name)

    await this._upsertFlow(botId, flow)

    const mutexFlow: FlowView = { ...flow, currentMutex }

    this.notifyChanges({
      name: flow.name,
      botId,
      modification: 'update',
      payload: mutexFlow,
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
      ghost.upsertFile(FLOW_DIR, flowPath!, JSON.stringify(flowContent, undefined, 2)),
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

    await this.moduleLoader.onFlowRenamed(botId, previousName, newName)

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

  private _buildFlowMutexKey(flowLocation: string): string {
    return 'FLOWMUTEX: ' + flowLocation
  }

  private async _testAndLockMutex(botId: string, currentFlowEditor: string, flowLocation: string): Promise<FlowMutex> {
    const key = this._buildFlowMutexKey(flowLocation)

    const currentMutex = ((await this.kvs.forBot(botId).get(key)) || {}) as FlowMutex
    const { lastModifiedBy: flowOwner, lastModifiedAt } = currentMutex

    const now = new Date()
    const remainingSeconds = this._getRemainingSeconds(now)

    if (currentFlowEditor === flowOwner) {
      const mutex: FlowMutex = {
        lastModifiedBy: flowOwner,
        lastModifiedAt: now
      }
      await this.kvs.forBot(botId).set(key, mutex)

      mutex.remainingSeconds = remainingSeconds
      return mutex
    }

    const isMutexExpired = !this._getRemainingSeconds(lastModifiedAt)
    if (!flowOwner || isMutexExpired) {
      const mutex: FlowMutex = {
        lastModifiedBy: currentFlowEditor,
        lastModifiedAt: now
      }
      await this.kvs.forBot(botId).set(key, mutex)

      mutex.remainingSeconds = remainingSeconds
      return mutex
    }

    throw new MutexError('Flow is currently locked by someone else')
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

  private async prepareSaveFlow(botId: string, flow: FlowView, isNew: boolean) {
    const schemaError = validateFlowSchema(flow, await this._isOneFlow(botId))
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
      // TODO: NDU Remove triggers
      ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'triggers', 'label', 'description']),
      nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
    }

    const flowPath = flow.location
    return { flowPath, uiPath: this.uiPath(flowPath!), flowContent, uiContent }
  }

  private uiPath(flowPath: string) {
    return flowPath.replace(/\.flow\.json$/i, '.ui.json')
  }

  public async getTopics(botId: string): Promise<Topic[]> {
    const ghost = this.ghost.forBot(botId)
    if (await ghost.fileExists('ndu', 'topics.json')) {
      const topics: any = ghost.readFileAsObject('ndu', 'topics.json')
      return topics
    }
    return []
  }

  public async deleteTopic(botId: string, topicName: string) {
    let topics = await this.getTopics(botId)
    topics = topics.filter(x => x.name !== topicName)

    await this.ghost.forBot(botId).upsertFile('ndu', `topics.json`, JSON.stringify(topics, undefined, 2))
    await this.moduleLoader.onTopicChanged(botId, topicName, undefined)
  }

  public async createTopic(botId: string, topic: Topic) {
    let topics = await this.getTopics(botId)
    topics = _.uniqBy([...topics, topic], x => x.name)

    await this.ghost.forBot(botId).upsertFile('ndu', `topics.json`, JSON.stringify(topics, undefined, 2))
    await this.moduleLoader.onTopicChanged(botId, undefined, topic.name)
  }

  public async updateTopic(botId: string, topic: Topic, topicName: string) {
    let topics = await this.getTopics(botId)
    topics = _.uniqBy([...topics.filter(x => x.name !== topicName), topic], x => x.name)

    await this.ghost.forBot(botId).upsertFile('ndu', `topics.json`, JSON.stringify(topics, undefined, 2))

    if (topicName !== topic.name) {
      await this.moduleLoader.onTopicChanged(botId, topicName, topic.name)

      const flows = await this.loadAll(botId)

      for (const flow of flows.filter(f => f.name.startsWith(`${topicName}/`))) {
        await this.renameFlow(botId, flow.name, flow.name.replace(`${topicName}/`, `${topic.name}/`), 'server')
      }
    }
  }
}
