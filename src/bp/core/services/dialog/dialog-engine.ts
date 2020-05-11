import { IO } from 'botpress/sdk'
import { FlowView } from 'common/typings'
import { createForGlobalHooks } from 'core/api'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { converseApiEvents } from '../converse'
import { Hooks, HookService } from '../hook/hook-service'

import { FlowError, ProcessingError, TimeoutNodeNotFound } from './errors'
import { FlowService } from './flow/service'
import { InstructionProcessor } from './instruction/processor'
import { InstructionQueue } from './instruction/queue'
import { InstructionsQueueBuilder } from './queue-builder'

const debug = DEBUG('dialog')

type FlowWithParent = FlowView & { parent?: string }

@injectable()
export class DialogEngine {
  public onProcessingError: ((err: ProcessingError, hideStack: boolean) => void) | undefined

  private _flowsByBot: Map<string, FlowWithParent[]> = new Map()

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

    if (event.ndu) {
      const workflowName = currentFlow.name?.replace('.flow.json', '')

      const { currentWorkflow } = event.state.session
      const { workflow } = event.state

      if (currentWorkflow !== workflowName) {
        this.changeWorkflow(event, workflowName)
        event.state.session.currentWorkflow = workflowName
      }

      const workflowEnded = currentNode.type === 'success' || currentNode.type === 'failure'
      if (workflowEnded && workflow) {
        workflow.success = currentNode.type === 'success'
        workflow.status = 'completed'
      }
    }

    // Property type skill-call means that the node points to a subflow.
    // We skip this step if we're exiting from a subflow, otherwise it will result in an infinite loop.
    if (_.get(currentNode, 'type') === 'skill-call' && !this._exitingSubflow(event)) {
      return this._goToSubflow(botId, event, sessionId, currentFlow, currentNode)
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
      this._endFlow(event)
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
          this._debug(event.botId, event.target, 'ending flow, because no transition destination defined (red port)')
          this._endFlow(event)
          return event
        }
        // We reset the queue when we transition to another node.
        // This way the queue will be rebuilt from the next node.
        context.queue = undefined

        return this._transition(sessionId, event, destination).catch(err => {
          event.state.__error = {
            type: 'dialog-transition',
            stacktrace: err.stacktrace || err.stack,
            destination: destination
          }

          const { onErrorFlowTo } = event.state.temp
          const errorFlowName = event.ndu ? 'Built-In/error.flow.json' : 'error.flow.json'
          const errorFlow = typeof onErrorFlowTo === 'string' && onErrorFlowTo.length ? onErrorFlowTo : errorFlowName

          return this._transition(sessionId, event, errorFlow)
        })
      }
    } catch (err) {
      this._reportProcessingError(botId, err, event, instruction)
    } finally {
      await converseApiEvents.emitAsync(`action.end.${event.target}`, event)
    }

    return event
  }

  public changeWorkflow(event: IO.IncomingEvent, nextFlow: string) {
    const { currentWorkflow, workflows } = event.state.session
    const { workflow } = event.state

    const parentFlow = this._findFlow(event.botId, `${nextFlow}.flow.json`).parent
    const isSubFlow = !!currentWorkflow && nextFlow.startsWith(currentWorkflow)

    // This workflow doesn't already exist, so we add it
    if (!workflow) {
      BOTPRESS_CORE_EVENT('bp_core_workflow_started', { botId: event.botId, channel: event.channel, wfName: nextFlow })

      event.state.session.workflows = {
        ...event.state.session.workflows,
        [nextFlow]: {
          eventId: event.id,
          status: 'active',
          parent: parentFlow
        }
      }
      return
    }

    // We dive one level deeper (one more child)
    if (isSubFlow) {
      BOTPRESS_CORE_EVENT('bp_core_workflow_started', { botId: event.botId, channel: event.channel, wfName: nextFlow })

      // The parent flow is inactive for now
      workflow.status = 'pending'

      event.state.session.workflows = {
        ...event.state.session.workflows,
        [nextFlow]: {
          eventId: event.id,
          status: 'active',
          parent: currentWorkflow
        }
      }
    } else {
      workflow.status = 'completed'

      // If the current workflow has a parent, and we return there, we update its status
      if (workflow.parent && workflows[nextFlow]) {
        workflows[nextFlow].status = 'active'
      }
    }
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

    // This is the only place we don't want to catch node or flow not found errors
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
      timeoutNode = findNodeWithoutError(currentFlow, 'timeout')
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

  private _endFlow(event: IO.IncomingEvent) {
    event.state.context = {}
    event.state.temp = {}
  }

  private initializeContext(event) {
    const defaultFlow = this._findFlow(event.botId, event.ndu ? 'Built-In/welcome.flow.json' : 'main.flow.json')
    const startNode = this._findNode(event.botId, defaultFlow, defaultFlow.startNode)
    event.state.__stacktrace.push({ flow: defaultFlow.name, node: startNode.name })
    event.state.context = {
      currentNode: startNode.name,
      currentFlow: defaultFlow.name
    }

    this._debug(event.botId, event.target, 'init new context', { ...event.state.context })
    return event.state.context
  }

  protected async _transition(sessionId: string, event: IO.IncomingEvent, transitionTo: string) {
    let context: IO.DialogContext = event.state.context
    if (!event.state.__error) {
      this._detectInfiniteLoop(event.state.__stacktrace, event.botId)
    }

    context.jumpPoints = context.jumpPoints?.filter(x => !x.used)

    if (transitionTo.includes('.flow.json')) {
      BOTPRESS_CORE_EVENT('bp_core_enter_flow', { botId: event.botId, channel: event.channel, flowName: transitionTo })
      // Transition to other flow
      const flow = this._findFlow(event.botId, transitionTo)
      const startNode = this._findNode(event.botId, flow, flow.startNode)
      event.state.__stacktrace.push({ flow: flow.name, node: startNode.name })

      context = {
        currentFlow: flow.name,
        currentNode: startNode.name,
        // Those two are not used in the backend logic, but keeping them since users rely on them
        previousFlow: event.state.context.currentFlow,
        previousNode: event.state.context.currentNode,
        jumpPoints: [
          ...(context.jumpPoints || []),
          {
            flow: context.currentFlow!,
            node: context.currentNode!
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
      const jumpPoints = context.jumpPoints
      const prevJumpPoint = _.findLast(jumpPoints, j => !j.used)

      if (!jumpPoints || !prevJumpPoint) {
        this._debug(event.botId, event.target, 'no previous flow found, current node is ' + context.currentNode)
        return event
      }

      // Multiple transitions on a node triggers each a processEvent, if we simply remove it, the second transition is no longer "exiting a subflow"
      prevJumpPoint.used = true

      const parentFlow = this._findFlow(event.botId, prevJumpPoint.flow)
      const specificNode = transitionTo.split('#')[1]
      const parentNode = this._findNode(event.botId, parentFlow, specificNode || prevJumpPoint.node)

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
        context.currentNode,
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

      event.state.__stacktrace.push({ flow: context.currentFlow!, node: transitionTo })
      // When we're in a sub flow, we must remember the location of the parent node for when we will exit
      const flowInfo = this._findFlow(event.botId, context.currentFlow!)
      const isInSubFlow = context.currentFlow?.startsWith('skills/') || !!flowInfo.parent
      if (isInSubFlow) {
        context = { ...context, currentNode: transitionTo }
      } else {
        context = { ...context, previousNode: context.currentNode, currentNode: transitionTo }
      }
    }

    event.state.context = context
    return this.processEvent(sessionId, event)
  }

  private async _goToSubflow(botId: string, event: IO.IncomingEvent, sessionId: string, parentFlow, parentNode) {
    const subflowName = parentNode.flow // Name of the subflow to transition to
    const subflow = this._findFlow(botId, subflowName)
    const subflowStartNode = this._findNode(botId, subflow, subflow.startNode)

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

    const flowsWithParents = flows.map(flow => {
      const flowName = flow.name.replace('.flow.json', '')
      const parentFlow = flows.find(x => x.name !== flow.name && flowName.startsWith(x.name.replace('.flow.json', '')))

      return {
        ...flow,
        parent: parentFlow?.name.replace('.flow.json', '')
      }
    })

    this._flowsByBot.set(botId, flowsWithParents)
  }

  private _detectInfiniteLoop(stacktrace: IO.JumpPoint[], botId: string) {
    // find the first node that gets repeated at least 3 times
    const loop = _.chain(stacktrace)
      .groupBy(x => `${x.flow}|${x.node}`)
      .values()
      .filter(x => x.length >= 3)
      .first()
      .value()

    if (!loop) {
      return
    }

    // we build the flow path for showing the loop to the end-user
    const recurringPath: string[] = []
    const { node, flow } = loop[0]
    for (let i = 0, r = 0; i < stacktrace.length && r < 2; i++) {
      if (stacktrace[i].flow === flow && stacktrace[i].node === node) {
        r++
      }
      if (r > 0) {
        recurringPath.push(`${stacktrace[i].flow} (${stacktrace[i].node})`)
      }
    }

    throw new FlowError(`Infinite loop detected. (${recurringPath.join(' --> ')})`, botId, loop[0].flow, loop[0].node)
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

  private _exitingSubflow(event: IO.IncomingEvent) {
    const { currentFlow, currentNode, jumpPoints } = event.state.context
    const recentUsed = jumpPoints?.find(j => j.used)

    return recentUsed?.flow === currentFlow && recentUsed?.node === currentNode
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
