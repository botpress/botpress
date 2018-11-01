import { IO, Logger } from 'botpress/sdk'
import { createForGlobalHooks } from 'core/api'
import { DialogContext } from 'core/repositories'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { Hooks, HookService } from '../hook/hook-service'

import { FlowView } from '.'
import { FlowService } from './flow/service'
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

// TODO: Rename when its safe to ditch V1
// TODO: Add integration tests and use the default welcome-bot flow as a test bench
@injectable()
export class DialogEngineV2 {
  public onProcessingError: ((err: ProcessingError) => void) | undefined

  private _flowsByBot: Map<string, FlowView[]> = new Map()

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.SessionService) private sessionService: SessionService,
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor,
    @inject(TYPES.HookService) private hookService: HookService
  ) {}

  public async processEvent(sessionId: string, event: IO.Event) {
    const botId = event.botId
    await this._loadFlows(botId)

    const session = await this._getOrCreateSession(sessionId, event)
    const currentFlow = this._findFlow(botId, session.context.currentFlowName)
    const currentNode = this._findNode(currentFlow, session.context.currentNodeName)

    // Property type skill-call means that the node points to a subflow.
    // We skip this step if we're exiting from a subflow, otherwise it will result in an infinite loop.
    if (_.get(currentNode, 'type') === 'skill-call' && !this._exitingSubflow(session)) {
      await this._goToSubflow(botId, event, session, currentNode, currentFlow)
      return
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
      this._logEnd(botId)
      return
    }

    try {
      const result = await this.instructionProcessor.process(botId, instruction, session)

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

  public async jumpTo(sessionId: string, event: IO.Event, targetFlowName: string, targetNodeName?: string) {
    const session = await this._getOrCreateSession(sessionId, event)
    const botId = event.botId

    const targetFlow = this._findFlow(botId, targetFlowName)
    let targetNode
    if (targetNodeName) {
      targetNode = this._findNode(targetFlow, targetNodeName)
    } else {
      targetNode = this._findNode(targetFlow, targetFlow.startNode)
    }

    const context = {
      currentFlowName: targetFlow.name,
      currentNodeName: targetNode.name
    }

    await this._updateContext(session.id, context)
  }

  public async processTimeout(botId: string, sessionId: string, event: IO.Event) {
    this._logTimeout(botId)

    // FIXME: Doesnt play well with tests
    // const api = await createForGlobalHooks()
    // await this.hookService.executeHook(new Hooks.BeforeSessionTimeout(api, event))

    // This is the only place we dont want to catch node not found errors
    const findNodeWithoutError = (flow, nodeName) => {
      try {
        const node = this._findNode(flow, nodeName)
        return node
      } catch (err) {
        // ignore
      }
      return undefined
    }

    const session = await this.sessionService.getSession(sessionId)
    const currentFlow = this._findFlow(botId, session.context.currentFlowName)
    const currentNode = findNodeWithoutError(currentFlow, session.context.currentNodeName)

    // Check for a timeout property in the current node
    let timeoutNode = _.get(currentNode, 'timeout')
    let timeoutFlow = currentFlow

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
      try {
        timeoutFlow = this._findFlow(botId, 'timeout.flow.json')
      } catch (err) {
        // ignore
      }
      const startNodeName = timeoutFlow.startNode
      timeoutNode = findNodeWithoutError(timeoutFlow, startNodeName)
    }

    if (!timeoutNode || !timeoutFlow) {
      throw new Error(`Could not find any timeout node for session "${sessionId}"`)
    }

    const context = {
      currentNodeName: timeoutNode.name,
      currentFlowName: timeoutFlow.name
    }

    await this._updateContext(sessionId, context)
    await this.processEvent(sessionId, event)
  }

  private async _getOrCreateSession(sessionId, event) {
    const session = await this.sessionService.getSession(sessionId)

    if (!session) {
      this._logStart(event.botId)

      // Create the new session context
      const defaultFlow = this._findFlow(event.botId, 'main.flow.json')
      const startNode = this._findNode(defaultFlow, defaultFlow.startNode)
      const context = {
        currentNodeName: startNode.name,
        currentFlowName: defaultFlow.name
      }
      const emptyState = {}
      return this.sessionService.createSession(sessionId, event.botId, emptyState, context, event)
    }

    return this.sessionService.updateSessionEvent(sessionId, event)
  }

  protected async _transition(sessionId, event, transitionTo) {
    const session = await this.sessionService.getSession(sessionId)
    let context = session.context

    if (transitionTo.includes('.flow.json')) {
      // Transition to other flow
      const flow = this._findFlow(event.botId, transitionTo)
      const startNode = this._findNode(flow, flow.startNode)

      context = {
        currentFlowName: flow.name,
        currentNodeName: startNode.name
      }
      this._logEnterFlow(
        event.botId,
        context.currentFlowName,
        context.currentNodeName,
        session.context.currentFlowName,
        session.context.currentNodeName
      )
    } else if (transitionTo.indexOf('#') === 0) {
      // Return to the parent node (coming from a subflow)
      const parentFlow = this._findFlow(event.botId, session.context.previousFlowName!)
      const parentNode = this._findNode(parentFlow, session.context.previousNodeName!)
      const builder = new InstructionsQueueBuilder(parentNode, parentFlow)
      const queue = builder.onlyTransitions().build()

      context = {
        ...context,
        currentNodeName: parentNode.name,
        currentFlowName: parentFlow.name,
        queue: queue.toString()
      }
      this._logExitFlow(event.botId, context.currentFlowName, context.currentFlowName, parentFlow, parentNode)
    } else if (transitionTo === 'END') {
      // END means the node has a transition of "end flow" in the flow editor
      await this.sessionService.deleteSession(sessionId)
      this._logEnd(event.botId)
      return
    } else {
      // Transition to the target node in the current flow
      this._logTransition(event.botId, context.currentFlowName, context.currentNodeName, transitionTo)
      context = { ...context, currentNodeName: transitionTo }
    }

    await this._updateContext(sessionId, context)
    await this.processEvent(sessionId, event)
  }

  private async _updateContext(sessionId, context) {
    const session = await this.sessionService.getSession(sessionId)
    session.context = context
    await this.sessionService.updateSession(session)
  }

  private async _updateState(sessionId, state) {
    const session = await this.sessionService.getSession(sessionId)
    session.state = state
    await this.sessionService.updateSession(session)
  }

  private async _updateQueue(sessionId, queue?: InstructionQueue) {
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

    this._logEnterFlow(
      botId,
      context.currentFlowName,
      context.currentNodeName,
      context.previousFlowName,
      context.previousNodeName
    )
    await this.sessionService.updateSessionContext(session.id, context)
    await this.processEvent(session.id, event)
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

  private _reportProcessingError(botId, error, session, instruction) {
    const nodeName = _.get(session, 'context.currentNodeName', 'N/A')
    const flowName = _.get(session, 'context.currentFlowName', 'N/A')
    const instructionDetails = instruction.fn || instruction.type
    this.onProcessingError &&
      this.onProcessingError(new ProcessingError(error.message, botId, nodeName, flowName, instructionDetails))
  }

  private _exitingSubflow(session) {
    const sameFlow = session.context.previousFlowName === session.context.currentFlowName
    const sameNode = session.context.previousNodeName === session.context.currentNodeName
    return sameFlow && sameNode
  }

  private _logExitFlow(botId, currentFlow, currentNode, previousFlow, previousNode) {
    this.logger.forBot(botId).debug(`(${currentFlow})[${currentNode}] << (${previousFlow})[${previousNode}]`)
  }

  private _logEnterFlow(botId, currentFlow, currentNode, previousFlow, previousNode) {
    this.logger.forBot(botId).debug(`(${previousFlow})[${previousNode}] >> (${currentFlow})[${currentNode}]`)
  }

  private _logTransition(botId, currentFlow, currentNode, transitionTo) {
    this.logger.forBot(botId).debug(`(${currentFlow})[${currentNode}] -> [${transitionTo}]`)
  }

  private _logEnd(botId) {
    this.logger.forBot(botId).debug('Flow ended.')
  }

  private _logStart(botId) {
    this.logger.forBot(botId).debug('Flow started.')
  }

  private _logTimeout(botId) {
    this.logger.forBot(botId).debug('Flow timed out.')
  }
}
