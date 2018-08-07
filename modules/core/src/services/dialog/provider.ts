import { inject, injectable, postConstruct, tagged } from 'inversify'
import _ from 'lodash'

import { ConfigProvider } from '../../config/config-loader'
import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { Flow, FlowProvider, FlowView } from '.'
import { validateFlowSchema } from './validator'

const PLACING_STEP = 250
const RENAME_THIS = 50

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

  async loadAll(): Promise<FlowView[]> {
    this.logger.debug('Loading flows')
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const bots = botpressConfig.bots

    const flowsPathsByBot = []
    for (const botId of bots) {
      flowsPathsByBot[botId] = await this.ghost.directoryListing(botId, 'flows', '.flow.json')
    }

    const flowsByBot = []
    for (const botId of bots) {
      const flowsPaths = flowsPathsByBot[botId]
      const flows = await Promise.map(flowsPaths, async (flowPath: string) => {
        const flowFile = <string>await this.ghost.readFile(botId, 'flows', flowPath)
        const flow = <Flow>JSON.parse(flowFile)

        const schemaError = validateFlowSchema(flow)!
        if (!flow || schemaError) {
          return flow ? this.logger.warn(schemaError) : undefined
        }

        const uiEqFile = <string>await this.ghost.readFile(botId, 'flows', this.uiPath(flowPath))
        const uiEq = <FlowView>JSON.parse(uiEqFile)

        Object.assign(flow, { links: uiEq['links'] })

        let unplacedIndex = -1

        const augmentedNodes = flow.nodes.map(node => {
          const position = _.get(_.find(uiEq.nodes, { id: node.id }), 'position')
          unplacedIndex = position ? unplacedIndex : unplacedIndex + 1

          return {
            ...node,
            x: position ? position.x : RENAME_THIS + unplacedIndex * PLACING_STEP,
            y: position ? position.y : (_.maxBy(flow.nodes, 'y') || { y: 0 })['y'] + PLACING_STEP
          }
        })

        return {
          name: flowPath,
          location: flowPath,
          nodes: _.filter(augmentedNodes, node => !!node),
          ..._.pick(flow, 'version', 'catchAll', 'startNode', 'links', 'skillData')
        }
      })

      flowsByBot[botId] = flows
    }

    return flowsByBot
  }

  async saveAll(flows: FlowView[]) {
    //
  }

  private uiPath(flowPath) {
    return flowPath.replace(/\.flow\.json/i, '.ui.json')
  }
}
