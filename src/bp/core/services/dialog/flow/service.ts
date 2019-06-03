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

const PLACING_STEP = 250
const MIN_POS_X = 50
const FLOW_DIR = 'flows'

@injectable()
export class FlowService {
  private _allFlows: Map<string, FlowView[]> = new Map()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
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

  private async parseFlow(botId: string, flowPath: string) {
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

    return {
      name: flowPath,
      location: flowPath,
      nodes: nodeViews,
      links: uiEq.links,
      version: flow.version,
      catchAll: flow.catchAll,
      startNode: flow.startNode,
      skillData: flow.skillData
    }
  }

  async saveAll(botId: string, flowViews: FlowView[], flowsToKeep: string[] = []) {
    process.ASSERT_LICENSED()
    if (!flowViews.find(f => f.name === 'main.flow.json') && flowsToKeep.indexOf('main.flow.json') === -1) {
      throw new Error(`Expected flows list to contain 'main.flow.json'`)
    }

    const flowFiles = await this.ghost.forBot(botId).directoryListing(FLOW_DIR, '*.json')
    const flowsToSave = await Promise.map(flowViews, flow => {
      const isNew = !flowFiles.find(x => flow.location === x)
      return this.prepareSaveFlow(botId, flow, isNew)
    })

    const flowsSavePromises = _.flatten(
      flowsToSave.map(({ flowPath, uiPath, flowContent, uiContent }) => [
        this.ghost.forBot(botId).upsertFile(FLOW_DIR, flowPath, JSON.stringify(flowContent, undefined, 2)),
        this.ghost.forBot(botId).upsertFile(FLOW_DIR, uiPath, JSON.stringify(uiContent, undefined, 2))
      ])
    )

    const pathsToOmit = _.flatten([
      ...flowsToSave.map(flow => [flow.flowPath, flow.uiPath]),
      ...flowsToKeep.map(f => [f, f.replace('.flow.json', '.ui.json')])
    ])

    const flowsToDelete = flowFiles.filter(f => !pathsToOmit.includes(f))
    const flowsDeletePromises = flowsToDelete.map(filePath => this.ghost.forBot(botId).deleteFile(FLOW_DIR, filePath))

    await Promise.all(flowsSavePromises.concat(flowsDeletePromises))
    this._allFlows.clear()
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

    return this.saveAll(botId, [flow])
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
