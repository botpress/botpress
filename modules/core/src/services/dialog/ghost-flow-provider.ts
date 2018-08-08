import { inject, injectable, postConstruct, tagged } from 'inversify'
import _ from 'lodash'

import { ConfigProvider } from '../../config/config-loader'
import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { Flow, FlowProvider, FlowView, FlowViewsByBot, NodeView } from '.'
import { validateFlowSchema } from './validator'

const PLACING_STEP = 250
const MIN_POS_X = 50

@injectable()
export default class GhostFlowProvider implements FlowProvider {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowProvider')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostContentService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  @postConstruct()
  async initialize(): Promise<void> {
    await this.ghost.addRootFolder(false, 'flows', { filesGlob: '**/*.json', isBinary: false })
  }

  async loadAll(): Promise<FlowViewsByBot> {
    this.logger.debug('Loading flows')
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const bots = botpressConfig.bots

    const flowsPathsByBot = []
    for (const botId of bots) {
      flowsPathsByBot[botId] = await this.ghost.directoryListing(botId, 'flows', '.flow.json')
    }

    const flowsByBot: FlowViewsByBot = {}

    for (const botId of bots) {
      try {
        const flowsPaths = flowsPathsByBot[botId]
        const flows = await Promise.map(flowsPaths, async (flowPath: string) => {
          return await this.parseFlowTODO(botId, flowPath)
        })

        flowsByBot[botId] = flows
      } catch (err) {
        console.log('lol', err)
      }
    }

    console.log(flowsByBot)

    return flowsByBot
  }

  private async parseFlowTODO(botId: string, flowPath: string) {
    const flowFile = <string>await this.ghost.readFile(botId, 'flows', flowPath)
    const flow = <Flow>JSON.parse(flowFile)
    const schemaError = validateFlowSchema(flow)

    if (!flow || schemaError) {
      throw new Error(`Invalid schema for for "${flowPath}". ` + schemaError)
    }

    const uiEqFile = <string>await this.ghost.readFile(botId, 'flows', this.uiPath(flowPath))
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

    return <FlowView>{
      name: flowPath,
      location: flowPath,
      nodes: nodeViews.filter(Boolean),
      links: uiEq.links,
      ..._.pick(flow, 'version', 'catchAll', 'startNode', 'skillData')
    }
  }

  async saveAll(flowsByBot: FlowViewsByBot) {
    //
  }

  private uiPath(flowPath) {
    return flowPath.replace(/\.flow\.json/i, '.ui.json')
  }
}
