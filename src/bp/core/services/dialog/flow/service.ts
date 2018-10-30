import { Flow, Logger } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { FlowView, NodeView } from '..'
import { GhostService } from '../..'
import { TYPES } from '../../../types'
import { validateFlowSchema } from '../validator'

const PLACING_STEP = 250
const MIN_POS_X = 50
const FLOW_DIR = 'flows'

@injectable()
export class FlowService {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {}

  async loadAll(botId: string): Promise<FlowView[]> {
    const flowsPath = this.ghost.forBot(botId).directoryListing(FLOW_DIR, '*.flow.json')

    try {
      return Promise.map(flowsPath, async (flowPath: string) => {
        return this.parseFlow(botId, flowPath)
      })
    } catch (err) {
      this.logger
        .forBot(botId)
        .attachError(err)
        .error('Could not load flows')
    }

    return []
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

  async saveAll(botId: string, flowViews: FlowView[]) {
    process.ASSERT_LICENSED()
    if (!flowViews.find(f => f.name === 'main.flow.json')) {
      throw new Error(`Expected flows list to contain 'main.flow.json'`)
    }

    const flowsToSave = flowViews.map(flow => this.prepareSaveFlow(flow))
    const flowsSavePromises = _.flatten(
      flowsToSave.map(({ flowPath, uiPath, flowContent, uiContent }) => [
        this.ghost.forBot(botId).upsertFile(FLOW_DIR, flowPath, JSON.stringify(flowContent, undefined, 2)),
        this.ghost.forBot(botId).upsertFile(FLOW_DIR, uiPath, JSON.stringify(uiContent, undefined, 2))
      ])
    )
    const pathsToOmit = _.flatten(flowsToSave.map(flow => [flow.flowPath, flow.uiPath]))
    const flowFiles = await this.ghost.forBot(botId).directoryListing(FLOW_DIR, '*.json')

    const flowsToDelete = flowFiles.filter(f => !pathsToOmit.includes(f))
    const flowsDeletePromises = flowsToDelete.map(filePath => this.ghost.forBot(botId).deleteFile(FLOW_DIR, filePath))

    await Promise.all(flowsSavePromises.concat(flowsDeletePromises))
  }

  private prepareSaveFlow(flow) {
    const schemaError = validateFlowSchema(flow)
    if (schemaError) {
      throw new Error(schemaError)
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
