import { Flow, Logger } from 'botpress/runtime-sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { ArrayCache } from '../../../common/array-cache'
import { FlowView, NodeView } from '../../../common/typings'
import { GhostService, ScopedGhostService } from '../../bpfs'
import { TYPES } from '../../types'
import { validateFlowSchema } from '../utils/validator'

const PLACING_STEP = 250
const MIN_POS_X = 50
const FLOW_DIR = 'flows'

@injectable()
export class FlowService {
  private scopes: { [botId: string]: ScopedFlowService } = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {}

  public forBot(botId: string): ScopedFlowService {
    let scope = this.scopes[botId]

    if (!scope) {
      scope = new ScopedFlowService(botId, this.ghost.forBot(botId), this.logger)
      this.scopes[botId] = scope
    }

    return scope
  }
}

export class ScopedFlowService {
  private cache: ArrayCache<string, FlowView>

  constructor(private botId: string, private ghost: ScopedGhostService, private logger: Logger) {
    this.cache = new ArrayCache<string, FlowView>(
      x => x.name,
      (x, prevKey, newKey) => ({ ...x, name: newKey, location: newKey })
    )
  }

  public reloadFlows() {
    if (!this.cache.values().length) {
      return
    }

    return this.loadFlowsInCache()
  }

  async getAllFlows() {
    if (this.cache.values().length) {
      return this.cache.values()
    }

    return this.loadFlowsInCache()
  }

  async loadFlowsInCache(): Promise<FlowView[]> {
    const flowsPath = this.ghost.directoryListing(FLOW_DIR, '*.flow.json', undefined, undefined, {
      sortOrder: { column: 'filePath' }
    })

    try {
      const flows = await Promise.map(flowsPath, async (flowPath: string) => {
        return this.parseFlow(flowPath)
      })

      this.cache.initialize(flows)

      return flows
    } catch (err) {
      this.logger
        .forBot(this.botId)
        .attachError(err)
        .error('Could not load flows')
      return []
    }
  }

  private async parseFlow(flowPath: string): Promise<FlowView> {
    const flow = await this.ghost.readFileAsObject<Flow>(FLOW_DIR, flowPath)
    const schemaError = validateFlowSchema(flow)

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

    return {
      name: flowPath,
      location: flowPath,
      nodes: nodeViews,
      links: uiEq.links,
      ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'label', 'description'])
    }
  }

  private toUiPath(flowPath: string) {
    return flowPath.replace(/\.flow\.json$/i, '.ui.json')
  }
}
