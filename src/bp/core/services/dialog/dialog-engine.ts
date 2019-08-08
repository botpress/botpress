import { IO } from 'botpress/sdk'
import { createForGlobalHooks } from 'core/api'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { converseApiEvents } from '../converse'
import { Hooks, HookService } from '../hook/hook-service'

import { FlowView } from '.'
import { FlowError, ProcessingError, TimeoutNodeNotFound } from './errors'
import { FlowService } from './flow/service'
import { InstructionProcessor } from './instruction/processor'
import { InstructionQueue } from './instruction/queue'
import { InstructionsQueueBuilder } from './queue-builder'

const debug = DEBUG('dialog')

@injectable()
export class DialogEngine {
  public onProcessingError: ((err: ProcessingError, hideStack: boolean) => void) | undefined

  private _flowsByBot: Map<string, FlowView[]> = new Map()

  constructor(
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor
  ) {}

  public async processEvent(sessionId: string, event: IO.IncomingEvent): Promise<IO.IncomingEvent> {
    const botId = event.botId
    await this._loadFlows(botId)

    const context = _.isEmpty(event.state.context) ? this.initializeContext(event) : event.state.context
    const currentFlow = this._findFlow(botId, context.currentFlow)
    const currentNode = this._findNode(botId, currentFlow, context.currentNode)

    // Property type skill-call means that the node points to a subflow.
    // We skip this step if we're exiting from a subflow, otherwise it will result in an infinite loop.
    if (_.get(currentNode, 'type') === 'skill-call' && !this._exitingSubflow(event)) {
      return this._goToSubflow(botId, event, sessionId, currentNode, currentFlow)
    }

    const queueBuilder = new InstructionsQueueBuilder(currentNode, currentFlow)
    let queue: InstructionQueue

    if (context.queue) {
      queue = InstructionsQueueBuilder.fromInstructions(context.queue.instructions)
    } else if (context.hasJumped) {
      queue = queueBuilder.hasJumped().build()
      context.hasJumped = false
    } else {
      queue = queueBuilder.build()
    }

    const instruction = queue.dequeue()
    // End session if there are no more instructions in the queue
    if (!instruction) {
      this._debug(event.botId, event.target, 'ending flow')
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
        this._debug(event.botId, event.target, 'waiting until next event')
        context.queue = queue
      } else if (result.followUpAction === 'transition') {
        const destination = result.options!.transitionTo!
        if (!destination || !destination.length) {
          this._debug(event.botId, event.target, 'ending flow, because no transition destination defined? (red port)')
          return event
        }
        // We reset the queue when we transition to another node.
        // This way the queue will be rebuilt from the next node.
        context.queue = undefined
        return this._transition(sessionId, event, destination)
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
      ? this._findNode(botId, targetFlow, targetNodeName)
      : this._findNode(botId, targetFlow, targetFlow.startNode)

    event.state.context.currentFlow = targetFlow.name
    event.state.context.currentNode = targetNode.name
    event.state.context.queue = undefined
    event.state.context.hasJumped = true
  }

  public async processTimeout(botId: string, sessionId: string, event: IO.IncomingEvent) {
    this._debug(event.botId, event.target, 'processing timeout')

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.BeforeSessionTimeout(api, event))

    await this._loadFlows(botId)

    // This is the only place we dont want to catch node or flow not found errors
    const findNodeWithoutError = (flow, nodeName) => {
      try {
        return this._findNode(botId, flow, nodeName)
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
      throw new TimeoutNodeNotFound(`Could not find any timeout node or flow for session "${sessionId}"`)
    }

    event.state.context.currentNode = timeoutNode.name
    event.state.context.currentFlow = timeoutFlow.name
    event.state.context.queue = undefined
    event.state.context.hasJumped = true

    return this.processEvent(sessionId, event)
  }

  private initializeContext(event) {
    const defaultFlow = this._findFlow(event.botId, 'main.flow.json')
    const startNode = this._findNode(event.botId, defaultFlow, defaultFlow.startNode)
    event.state.__stacktrace.push({ flow: defaultFlow.name, node: startNode.name })
    event.state.context = {
      currentNode: startNode.name,
      currentFlow: defaultFlow.name
    }

    this._debug(event.botId, event.target, 'init new context', { ...event.state.context })
    return event.state.context
  }

  protected async _transition(sessionId, event, transitionTo) {
    let context: IO.DialogContext = event.state.context

    if (transitionTo.includes('.flow.json')) {
      // Transition to other flow
      const flow = this._findFlow(event.botId, transitionTo)
      const startNode = this._findNode(event.botId, flow, flow.startNode)
      event.state.__stacktrace.push({ flow: flow.name, node: startNode.name })

      context = {
        currentFlow: flow.name,
        currentNode: startNode.name,
        // We keep a reference of the previous flow so we can return to it later on.
        // TODO: drop previousFlow/previousNode in favor of jumpPoints
        previousFlow: event.state.context.currentFlow,
        previousNode: event.state.context.currentNode,
        jumpPoints: [
          ...(event.state.context.jumpPoints || []),
          {
            flow: event.state.context.currentFlow,
            node: event.state.context.currentNode
          }
        ]
      }

      this._logEnterFlow(
        event.botId,
        event.target,
        context.currentFlow,
        context.currentNode,
        event.state.context.currentFlow,
        event.state.context.currentNode
      )
    } else if (transitionTo.indexOf('#') === 0) {
      // Return to the parent node (coming from a flow)
      const jumpPoints = event.state.context.jumpPoints
      const prevJumpPoint = jumpPoints && jumpPoints.pop()
      const parentFlow = this._findFlow(event.botId, prevJumpPoint.flow)
      const specificNode = transitionTo.split('#')[1]
      let parentNode

      if (specificNode) {
        parentNode = this._findNode(event.botId, parentFlow, specificNode)
      } else {
        parentNode = this._findNode(event.botId, parentFlow, prevJumpPoint.node)
      }

      const builder = new InstructionsQueueBuilder(parentNode, parentFlow)
      const queue = builder.onlyTransitions().build()

      event.state.__stacktrace.push({ flow: parentFlow.name, node: parentNode.name })

      context = {
        ...context,
        currentNode: parentNode.name,
        currentFlow: parentFlow.name,
        jumpPoints,
        queue
      }

      this._logExitFlow(
        event.botId,
        event.target,
        context.currentFlow,
        context.currentFlow,
        parentFlow.name,
        parentNode.name
      )
    } else if (transitionTo === 'END') {
      // END means the node has a transition of "end flow" in the flow editor
      delete event.state.context
      this._debug(event.botId, event.target, 'ending flow')
      return event
    } else {
      // Transition to the target node in the current flow
      this._logTransition(event.botId, event.target, context.currentFlow, context.currentNode, transitionTo)

      // When we're in a skill, we must remember the location of the main node for when we will exit
      const isInSkill = context.currentFlow && context.currentFlow.startsWith('skills/')
      if (isInSkill) {
        context = { ...context, currentNode: transitionTo }
      } else {
        event.state.__stacktrace.push({ flow: context.currentFlow, node: transitionTo })
        context = { ...context, previousNode: context.currentNode, currentNode: transitionTo }
      }
    }

    event.state.context = context
    return this.processEvent(sessionId, event)
  }

  private async _goToSubflow(botId, event, sessionId, parentNode, parentFlow) {
    const subflowName = parentNode.flow // Name of the subflow to transition to
    const subflow = this._findFlow(botId, subflowName)
    const subflowStartNode = this._findNode(botId, subflow, subflow.startNode)

    // We only update previousNodeName and previousFlowName when we transition to a subblow.
    // When the sublow ends, we will transition back to previousNodeName / previousFlowName.

    event.state.context = {
      currentFlow: subflow.name,
      currentNode: subflowStartNode.name,
      previousFlow: parentFlow.name,
      previousNode: parentNode.name,
      jumpPoints: [
        ...(event.state.context.jumpPoints || []),
        {
          flow: parentFlow.name,
          node: parentNode.name
        }
      ]
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
      throw new FlowError(`Could not find any flow.`, botId, flowName)
    }

    const flow = flows.find(x => x.name === flowName)
    if (!flow) {
      throw new FlowError(`Flow not found."`, botId, flowName)
    }
    return flow
  }

  private _findNode(botId: string, flow: FlowView, nodeName: string) {
    const node = flow.nodes && flow.nodes.find(x => x.name === nodeName)
    if (!node) {
      throw new FlowError(`Node not found.`, botId, flow.name, nodeName)
    }
    return node
  }

  private _reportProcessingError(botId, error, event, instruction) {
    const nodeName = _.get(event, 'state.context.currentNode', 'N/A')
    const flowName = _.get(event, 'state.context.currentFlow', 'N/A')
    const instructionDetails = instruction.fn || instruction.type
    this.onProcessingError &&
      this.onProcessingError(
        new ProcessingError(error.message, botId, nodeName, flowName, instructionDetails),
        error.hideStack
      )
  }

  private _exitingSubflow(event) {
    const { currentFlow, currentNode, previousFlow, previousNode } = event.state.context
    return previousFlow === currentFlow && previousNode === currentNode
  }

  private _debug(botId: string, target: string, action: string, args?: any) {
    if (args) {
      debug.forBot(botId, `[${target}] ${action} %o`, args)
    } else {
      debug.forBot(botId, `[${target}] ${action}`)
    }
  }

  private _logExitFlow(botId, target, currentFlow, currentNode, previousFlow, previousNode) {
    this._debug(botId, target, `transit (${currentFlow}) [${currentNode}] << (${previousFlow}) [${previousNode}]`)
  }

  private _logEnterFlow(botId, target, currentFlow, currentNode, previousFlow, previousNode) {
    this._debug(botId, target, `transit (${previousFlow}) [${previousNode}] >> (${currentFlow}) [${currentNode}]`)
  }

  private _logTransition(botId, target, currentFlow, currentNode, transitionTo) {
    this._debug(botId, target, `transit (${currentFlow}) [${currentNode}] -> [${transitionTo}]`)
  }
}
