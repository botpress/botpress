import { IO } from 'botpress/sdk'
import { TYPES } from 'core/types'
import { inject } from 'inversify'

import { FlowView } from '.'
import FlowService from './flow/service'
import { InstructionsQueueBuilder } from './queue-builder'
import { SessionService } from './session/service'

class DialogEngineError extends Error {}

class FlowNotFoundError extends DialogEngineError {}
class NodeNotFoundError extends DialogEngineError {}

export class DialogEngine {
  private _flowsByBot: Map<string, FlowView[]> = new Map()

  constructor(
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.SessionService) private sessionService: SessionService
  ) {}

  public async processEvent(sessionId: string, event: IO.Event) {
    const botId = event.botId
    await this._loadFlows(botId)
    let session = await this.sessionService.getSession(sessionId)

    if (!session) {
      // create new session
      const defaultFlow = this._findFlow(botId, 'main.flow.json')
      const startNode = this._findNode(defaultFlow, defaultFlow.startNode)
      const context = {
        currentNodeName: startNode.name,
        currentFlowName: defaultFlow.name
      }
      const emptyState = {}
      session = await this.sessionService.createSession(sessionId, botId, emptyState, context, event)
    }

    const currentFlow = this._findFlow(botId, session.context.currentFlowName)
    const currentNode = this._findNode(currentFlow, session.context.currentNodeName)
    this._processNode(botId, currentNode, currentFlow)
  }

  private _processNode(botId, node, flow) {
    if (node.type === 'skill-call') {
      this._goToSubflow(botId, node)
    }

    const builder = new InstructionsQueueBuilder(node, flow)
    const queue = builder.build()
  }

  private _goToSubflow(botId, node) {
    const subflowName = node.flow
    const subflow = this._findFlow(botId, subflowName)
    const subflowStartNode = this._findNode(subflow, subflow.startNode)

    this._processNode(botId, subflowStartNode, subflow)
  }

  private async _loadFlows(botId: string) {
    const flows = await this.flowService.loadAll(botId)
    this._flowsByBot.set(botId, flows)
  }

  private _findFlow(botId: string, flowName: string) {
    const flow = this._flowsByBot[botId].find(x => x.name === flowName)
    if (!flow) {
      throw new FlowNotFoundError(`Flow ${flowName} not found for bot ${botId}.`)
    }
    return flow
  }

  private _findNode(flow, nodeName: string) {
    const node = flow.nodes && flow.nodes.find(x => x.name === nodeName)
    if (!node) {
      throw new NodeNotFoundError(`Node ${nodeName} not found in flow ${flow.name}`)
    }
    return node
  }
}
