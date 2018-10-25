import { IO } from 'botpress/sdk'
import { DialogContext } from 'core/repositories'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { FlowView } from '.'
import FlowService from './flow/service'
import { InstructionProcessor } from './instruction/processor'
import { InstructionQueue } from './instruction/queue'
import { InstructionsQueueBuilder } from './queue-builder'
import { SessionService } from './session/service'

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
  onProcessingError: ((err: ProcessingError) => void) | undefined

  private _flowsByBot: Map<string, FlowView[]> = new Map()

  constructor(
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.SessionService) private sessionService: SessionService,
    @inject(TYPES.InstructionProcessor) private instructionProcesseor: InstructionProcessor
  ) {}

  public async processEvent(sessionId: string, event: IO.Event) {
    const botId = event.botId
    await this._loadFlows(botId)
    let session = await this.sessionService.getSession(sessionId)

    if (!session) {
      // Create the new session context
      const defaultFlow = this._findFlow(botId, 'main.flow.json')
      const startNode = this._findNode(defaultFlow, defaultFlow.startNode)
      const context = {
        currentNodeName: startNode.name,
        currentFlowName: defaultFlow.name
      }
      const emptyState = {}
      session = await this.sessionService.createSession(sessionId, botId, emptyState, context, event)
    } else {
      await this.sessionService.updateSessionEvent(sessionId, event)
    }

    const currentFlow = this._findFlow(botId, session.context.currentFlowName)
    const currentNode = this._findNode(currentFlow, session.context.currentNodeName)

    // skill-call type means that the current node contains the subflow for a skill-choice
    if (currentNode.type === 'skill-call') {
      return this._goToSubflow(botId, event, session, currentNode, currentFlow)
    }

    let queue: InstructionQueue
    if (session.context.queue) {
      queue = new InstructionQueue(session.context.queue)
    } else {
      const builder = new InstructionsQueueBuilder(currentNode, currentFlow)
      queue = builder.build()
    }

    const instruction = queue.dequeue()
    // End session if there are no more instructions in the queue
    if (!instruction) {
      await this.sessionService.deleteSession(sessionId)
      return
    }

    try {
      const result = await this.instructionProcesseor.process(botId, instruction, session.state, session.event, session.context)
      if (result.followUpAction === 'none') {
        await this._updateQueue(sessionId, queue)
        await this.processEvent(sessionId, event)
      } else if (result.followUpAction === 'update') {
        // We update the state that has been modified in an action.
        // The new state is returned in the instruction processor result.
        await this._updateState(sessionId, result.options!.state)
        await this._updateQueue(sessionId, queue)
        await this.processEvent(sessionId, event)
      } else if (result.followUpAction === 'wait') {
        // We don't call processEvent, because we want to wait for the next event
        await this._updateQueue(sessionId, queue)
      } else if (result.followUpAction === 'transition') {
        // We reset the queue when we transition to another node.
        // This way the queue will be rebuilt from the next node.
        await this._updateQueue(sessionId, undefined)
        await this._transition(sessionId, event, result.options!.transitionTo!)
      }
    } catch (err) {
      this._reportProcessingError(botId, err, session, instruction)
    }
  }

  public jumpTo(sessionId, event, flowName, nodeName) {

  }

  public processTimeout(botId, id) {

  }

  private async _transition(sessionId, event, transitionTo: string) {
    const session = await this.sessionService.getSession(sessionId)
    let context = session.context

    // Return to the parent node (coming from a subflow)
    if (transitionTo.indexOf('#') === 0) {
      context = {
        currentNodeName : session.context.previousNodeName!,
        currentFlowName : session.context.previousFlowName!,
        previousNodeName : undefined,
        previousFlowName : undefined,
      }
    // END means the node has a transition of "end flow" in the flow editor
    } else if (transitionTo === 'END') {
      await this.sessionService.deleteSession(sessionId)
      return
    // Transition to the next node in the current flow
    } else {
      context = {...context, currentNodeName: transitionTo}
    }

    await this._updateContext(sessionId, context)
    await this.processEvent(sessionId, event)
  }

  private async _updateContext(sessionId, context) {
    const session = await this.sessionService.getSession(sessionId)
    session.context = context
    await this.sessionService.updateSession(session)
  }

  private async _updateState(sessionId: string, state) {
    const session = await this.sessionService.getSession(sessionId)
    session.state = state
    await this.sessionService.updateSession(session)
  }

  private async _updateQueue(sessionId: string, queue?: InstructionQueue) {
    const session = await this.sessionService.getSession(sessionId)
    const context = session.context
    context.queue = queue ? queue.toString() : undefined
    await this.sessionService.updateSessionContext(sessionId, context)
  }

  private async _goToSubflow(botId, event, session, parentNode, parentFlow) {
    const subflowName = parentNode.flow // Name of the subflow to transition to
    const subflow = this._findFlow(botId, subflowName)
    const subflowStartNode = this._findNode(subflow, subflow.startNode)

    // We only update previousNodeName and previousFlowName when we transition to a subblow.
    // When the sublow ends, we will transition back to previousNodeName / previousFlowName.
    const context: DialogContext = {
      currentNodeName: subflowStartNode.name,
      currentFlowName: subflow.name,
      previousNodeName: parentNode.name,
      previousFlowName: parentFlow.name
    }

    await this.sessionService.updateSessionContext(session.id, context)
    await this.processEvent(session.id, event)
  }

  private async _loadFlows(botId: string) {
    const flows = await this.flowService.loadAll(botId)
    this._flowsByBot.set(botId, flows)
  }

  private _findFlow(botId: string, flowName: string) {
    const flows = this._flowsByBot.get(botId)
    if (!flows) {
      throw new FlowNotFoundError(`Could not find any flow for ${botId}.`)
    }

    const flow =  flows.find(x => x.name === flowName)
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

  private _reportProcessingError(botId, error, session, instruction) {
    const nodeName = _.get(session, 'context.currentNodeName', 'N/A')
    const flowName = _.get(session, 'context.currentFlowName', 'N/A')
    const instructionDetails = instruction.fn || instruction.type
    this.onProcessingError &&
      this.onProcessingError(new ProcessingError(error.message, botId, nodeName, flowName, instructionDetails))
  }
}
