import { inject, injectable, postConstruct, tagged } from 'inversify'
import _ from 'lodash'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { Flow, FlowView, NodeView } from '.'
import { validateFlowSchema } from './validator'

const PLACING_STEP = 250
const MIN_POS_X = 50

@injectable()
export default class FlowService {
  private readonly flowDir = 'flows'

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowProvider')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostContentService
  ) {}

  @postConstruct()
  async initialize(): Promise<void> {
    await this.ghost.addRootFolder(false, this.flowDir, { filesGlob: '**/*.json', isBinary: false })
  }

  async loadAll(botId: string): Promise<FlowView[]> {
    const flowPath = await this.ghost.directoryListing(botId, this.flowDir, '.flow.json')
    try {
      return await Promise.map(flowPath, async (flowPath: string) => {
        return await this.parseFlow(botId, flowPath)
      })
    } catch (err) {
      this.logger.error(`Could not load flows for bot ID "${botId}"`)
    }

    return []
  }

  private async parseFlow(botId: string, flowPath: string) {
    const flowFile = <string>await this.ghost.readFile(botId, this.flowDir, flowPath)
    const flow = <Flow>JSON.parse(flowFile)
    const schemaError = validateFlowSchema(flow)

    if (!flow || schemaError) {
      throw new Error(`Invalid schema for "${flowPath}". ` + schemaError)
    }

    const uiEqFile = <string>await this.ghost.readFile(botId, this.flowDir, this.uiPath(flowPath))
    const uiEq = <FlowView>JSON.parse(uiEqFile)

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

    this.logger.debug(`Bot '${botId}' loaded flow '${flowPath}'`)

    return <FlowView>{
      name: flowPath,
      location: flowPath,
      nodes: nodeViews.filter(Boolean),
      links: uiEq.links,
      ..._.pick(flow, 'version', 'catchAll', 'startNode', 'skillData')
    }
  }

  async saveAll(botId: string, flowViews: FlowView[]) {
    if (!flowViews.find(f => f.name === 'main.flow.json')) {
      throw new Error(`Expected flows list to contain 'main.flow.json'`)
    }
    console.log(flowViews)

    const flowsToSave = flowViews.map(flow => this.prepareSaveFlow(flow))
    const flowsSavePromises = _.flatten(
      flowsToSave.map(({ flowPath, uiPath, flowContent, uiContent }) => [
        this.ghost.upsertFile(botId, this.flowDir, flowPath, JSON.stringify(flowContent, undefined, 2)),
        this.ghost.upsertFile(botId, this.flowDir, uiPath, JSON.stringify(uiContent, undefined, 2))
      ])
    )
    const pathsToOmit = _.flatten(flowsToSave.map(flow => [flow.flowPath, flow.uiPath]))

    const flowFiles = await this.ghost.directoryListing(botId, this.flowDir, '.json', pathsToOmit)
    const flowsDeletePromises = flowFiles.map(filePath => this.ghost.deleteFile(botId, this.flowDir, filePath))

    await Promise.all(flowsSavePromises.concat(flowsDeletePromises))
    // this.emit('flowsChanged')
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
