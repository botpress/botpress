import { IO, Logger } from 'botpress/sdk'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { converseApiEvents } from '../converse'
import { HookService } from '../hook/hook-service'

import { FlowView } from '.'
import { FlowService } from './flow/service'
import { InstructionProcessor } from './instruction/processor'
import { InstructionQueue } from './instruction/queue'
import { InstructionsQueueBuilder } from './queue-builder'

export class ProcessingError extends Error {
  constructor(
    message: string,
    public readonly botId: string,
    public readonly nodeName: string,
    public readonly flowName: string,
    public readonly instruction: string
  ) {
    super(message)
  }
}

class DialogEngineError extends Error {}
class FlowNotFoundError extends DialogEngineError {}
class NodeNotFoundError extends DialogEngineError {}

@injectable()
export class DialogEngine {
  public onProcessingError: ((err: ProcessingError) => void) | undefined

  private _flowsByBot: Map<string, FlowView[]> = new Map()

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor,
    @inject(TYPES.HookService) private hookService: HookService
  ) {}

  public async processEvent(sessionId: string, event: IO.IncomingEvent): Promise<IO.IncomingEvent> {
    const botId = event.botId
    await this._loadFlows(botId)

    const context = _.isEmpty(event.state.context) ? this.initializeContext(event) : event.state.context
    const currentFlow = this._findFlow(botId, context.currentFlow)
    const currentNode = this._findNode(currentFlow, context.currentNode)

    // Property type skill-call means that the node points to a subflow.
    // We skip this step if we're exiting from a subflow, otherwise it will result in an infinite loop.
    if (_.get(currentNode, 'type') === 'skill-call' && !this._exitingSubflow(event)) {
      return this._goToSubflow(botId, event, sessionId, currentNode, currentFlow)
    }

    let queue: InstructionQueue
    if (context.queue) {
      queue = new InstructionQueue(context.queue.instructions)
    } else {
      const builder = new InstructionsQueueBuilder(currentNode, currentFlow)
      queue = builder.build()
    }

    const instruction = queue.dequeue()
    // End session if there are no more instructions in the queue
    if (!instruction) {
      this._logEnd(botId)
      event.state.context = {}
      event.state.temp = {}
      return event
    }

    try {
      await converseApiEvents.emitAsync(`action.start.${event.target}`, event)
      const result = await this.instructionProcessor.process(botId, instruction, event)

      if (result.followUpAction === 'none') {
        context.queue = queue
        return this.processEvent(sessionId, event)
      } else if (result.followUpAction === 'wait') {
        // We don't call processEvent, because we want to wait for the next event
        this._logWait(botId)
        context.queue = queue
      } else if (result.followUpAction === 'transition') {
        // We reset the queue when we transition to another node.
        // This way the queue will be rebuilt from the next node.
        context.queue = undefined
        return this._transition(sessionId, event, result.options!.transitionTo!)
      }
    } catch (err) {
      this._reportProcessingError(botId, err, event, instruction)
    } finally {
      await converseApiEvents.emitAsync(`action.end.${event.target}`, event)
    }

    return event
  }

  public async jumpTo(sessionId: string, event: IO.IncomingEvent, targetFlowName: string, targetNodeName?: string) {
    const botId = event.botId
    await this._loadFlows(botId)

    const targetFlow = this._findFlow(botId, targetFlowName)
    const targetNode = targetNodeName
      ? this._findNode(targetFlow, targetNodeName)
      : this._findNode(targetFlow, targetFlow.startNode)

    event.state.context.currentFlow = targetFlow.name
    event.state.context.currentNode = targetNode.name
  }

  public async processTimeout(botId: string, sessionId: string, event: IO.IncomingEvent) {
    this._logTimeout(botId)
    await this._loadFlows(botId)

    // This is the only place we dont want to catch node or flow not found errors
    const findNodeWithoutError = (flow, nodeName) => {
      try {
        return this._findNode(flow, nodeName)
      } catch (err) {
        // ignore
      }
      return undefined
    }
    const findFlowWithoutError = flowName => {
      try {
        return this._findFlow(botId, flowName)
      } catch (err) {
        // ignore
      }
      return undefined
    }

    const currentFlow = this._findFlow(botId, event.state.context.currentFlow!)
    const currentNode = findNodeWithoutError(currentFlow, event.state.context.currentNode)

    // Check for a timeout property in the current node
    let timeoutNode = _.get(currentNode, 'timeout')
    let timeoutFlow: FlowView | undefined = currentFlow

    // Check for a timeout node in the current flow
    if (!timeoutNode) {
      timeoutNode = findNodeWithoutError(timeoutFlow, 'timeout')
    }

    // Check for a timeout property in the current flow
    if (!timeoutNode) {
      const timeoutNodeName = _.get(timeoutFlow, 'timeoutNode')
      if (timeoutNodeName) {
        timeoutNode = findNodeWithoutError(timeoutFlow, timeoutNodeName)
      }
    }

    // Check for a timeout.flow.json and get the start node
    if (!timeoutNode) {
      timeoutFlow = findFlowWithoutError('timeout.flow.json')
      if (timeoutFlow) {
        const startNodeName = timeoutFlow.startNode
        timeoutNode = findNodeWithoutError(timeoutFlow, startNodeName)
      }
    }

    if (!timeoutNode || !timeoutFlow) {
      throw new Error(`Could not find any timeout node for session "${sessionId}"`)
    }

    event.state.context.currentNode = timeoutNode.name
    event.state.context.currentFlow = timeoutFlow.name

    return await this.processEvent(sessionId, event)
  }

  private initializeContext(event) {
    this._logStart(event.botId)

    const defaultFlow = this._findFlow(event.botId, 'main.flow.json')
    const startNode = this._findNode(defaultFlow, defaultFlow.startNode)

    event.state.context = {
      currentNode: startNode.name,
      currentFlow: defaultFlow.name
    }

    return event.state.context
  }

  protected async _transition(sessionId, event, transitionTo) {
    let context: IO.DialogContext = event.state.context

    if (transitionTo.includes('.flow.json')) {
      // Transition to other flow
      const flow = this._findFlow(event.botId, transitionTo)
      const startNode = this._findNode(flow, flow.startNode)

      context = {
        currentFlow: flow.name,
        currentNode: startNode.name,
        // We keep a reference of the previous flow so we can return to it later on.
        previousFlow: event.state.context.currentFlow,
        previousNode: event.state.context.currentNode
      }
      this._logEnterFlow(
        event.botId,
        context.currentFlow,
        context.currentNode,
        event.state.context.currentFlow,
        event.state.context.currentNode
      )
    } else if (transitionTo.indexOf('#') === 0) {
      // Return to the parent node (coming from a flow)
      const parentFlow = this._findFlow(event.botId, event.state.context.previousFlow!)
      const specificNode = transitionTo.split('#')[1]
      let parentNode

      if (specificNode) {
        parentNode = this._findNode(parentFlow, specificNode)
      } else {
        parentNode = this._findNode(parentFlow, event.state.context.previousNode!)
      }

      const builder = new InstructionsQueueBuilder(parentNode, parentFlow)
      const queue = builder.onlyTransitions().build()

      context = {
        ...context,
        currentNode: parentNode.name,
        currentFlow: parentFlow.name,
        queue
      }
      this._logExitFlow(event.botId, context.currentFlow, context.currentFlow, parentFlow.name, parentNode.name)
    } else if (transitionTo === 'END') {
      // END means the node has a transition of "end flow" in the flow editor
      delete event.state.context
      this._logEnd(event.botId)
      return event
    } else {
      // Transition to the target node in the current flow
      this._logTransition(event.botId, context.currentFlow, context.currentNode, transitionTo)
      context = { ...context, currentNode: transitionTo }
    }

    event.state.context = context
    return this.processEvent(sessionId, event)
  }

  private async _goToSubflow(botId, event, sessionId, parentNode, parentFlow) {
    const subflowName = parentNode.flow // Name of the subflow to transition to
    const subflow = this._findFlow(botId, subflowName)
    const subflowStartNode = this._findNode(subflow, subflow.startNode)

    // We only update previousNodeName and previousFlowName when we transition to a subblow.
    // When the sublow ends, we will transition back to previousNodeName / previousFlowName.

    event.state.context = {
      currentFlow: subflow.name,
      currentNode: subflowStartNode.name,
      previousFlow: parentFlow.name,
      previousNode: parentNode.name
    }

    return this.processEvent(sessionId, event)
  }

  protected async _loadFlows(botId: string) {
    const flows = await this.flowService.loadAll(botId)
    this._flowsByBot.set(botId, flows)
  }

  private _findFlow(botId: string, flowName: string) {
    const flows = this._flowsByBot.get(botId)
    if (!flows) {
      throw new FlowNotFoundError(`Could not find any flow for ${botId}.`)
    }

    const flow = flows.find(x => x.name === flowName)
    if (!flow) {
      throw new FlowNotFoundError(`Flow ${flowName} not found for bot ${botId}.`)
    }
    return flow
  }

  private _findNode(flow, nodeName: string) {
    const node = flow.nodes && flow.nodes.find(x => x.name === nodeName)
    if (!node) {
      throw new NodeNotFoundError(`Could not find any node called "${nodeName}" under flow "${flow.name}"`)
    }
    return node
  }

  private _reportProcessingError(botId, error, event, instruction) {
    const nodeName = _.get(event, 'state.context.currentNode', 'N/A')
    const flowName = _.get(event, 'state.context.currentFlow', 'N/A')
    const instructionDetails = instruction.fn || instruction.type
    this.onProcessingError &&
      this.onProcessingError(new ProcessingError(error.message, botId, nodeName, flowName, instructionDetails))
  }

  private _exitingSubflow(event) {
    const { currentFlow, currentNode, previousFlow, previousNode } = event.state.context
    return previousFlow === currentFlow && previousNode === currentNode
  }

  private _logExitFlow(botId, currentFlow, currentNode, previousFlow, previousNode) {
    this.logger.forBot(botId).debug(`TRANSIT (${currentFlow}) [${currentNode}] << (${previousFlow}) [${previousNode}]`)
  }

  private _logEnterFlow(botId, currentFlow, currentNode, previousFlow, previousNode) {
    this.logger.forBot(botId).debug(`TRANSIT (${previousFlow}) [${previousNode}] >> (${currentFlow}) [${currentNode}]`)
  }

  private _logTransition(botId, currentFlow, currentNode, transitionTo) {
    this.logger.forBot(botId).debug(`TRANSIT (${currentFlow}) [${currentNode}] -> [${transitionTo}]`)
  }

  private _logEnd(botId) {
    this.logger.forBot(botId).debug('END FLOW')
  }

  private _logStart(botId) {
    this.logger.forBot(botId).debug('EVENT RECV')
  }

  private _logTimeout(botId) {
    this.logger.forBot(botId).debug('TIMEOUT')
  }

  private _logWait(botId) {
    this.logger.forBot(botId).debug('WAIT')
  }
}
