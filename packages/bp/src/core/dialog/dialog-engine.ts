import { FlowNode, IO, Logger } from 'botpress/sdk'
import { FlowView } from 'common/typings'
import { createForGlobalHooks } from 'core/app/api'
import { TYPES } from 'core/app/types'
import { buildUserKey, converseApiEvents } from 'core/converse'
import { FlowService } from 'core/dialog'
import { addErrorToEvent } from 'core/events'
import { Hooks, HookService } from 'core/user-code'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { FlowError, InfiniteLoopError, TimeoutNodeNotFound } from './errors'
import { Instruction } from './instruction'
import { InstructionProcessor } from './instruction/processor'
import { InstructionQueue } from './instruction/queue'
import { InstructionsQueueBuilder } from './queue-builder'

const debug = DEBUG('dialog')

type FlowWithParent = FlowView & { parent?: string }

@injectable()
export class DialogEngine {
  private _flowsByBot: Map<string, FlowWithParent[]> = new Map()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'DialogEngine')
    private logger: Logger,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor
  ) {}

  public async processEvent(sessionId: string, event: IO.IncomingEvent): Promise<IO.IncomingEvent> {
    const botId = event.botId
    await this._loadFlows(botId)

    const context: IO.DialogContext = _.isEmpty(event.state.context)
      ? this.initializeContext(event)
      : event.state.context

    const currentFlow = this._findFlow(botId, context.currentFlow!)
    const currentNode = this._findNode(botId, currentFlow, context.currentNode!)

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

    if (context.hasJumped) {
      queue = queueBuilder.hasJumped().build()
      context.hasJumped = false
    } else if (context.queue) {
      queue = InstructionsQueueBuilder.fromInstructions(context.queue.instructions)
    } else {
      queue = queueBuilder.build()
    }

    const instruction = queue.dequeue()
    // End session if there are no more instructions in the queue
    if (!instruction) {
      this._debug(event.botId, event.target, 'ending flow')
      await this._endFlow(event)
      return event
    }

    try {
      await converseApiEvents.emitAsync(`action.start.${buildUserKey(event.botId, event.target)}`, event)
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
          await this._endFlow(event)
          return event
        }
        // We reset the queue when we transition to another node.
        // This way the queue will be rebuilt from the next node.
        context.queue = undefined

        try {
          const incommingEvent = await this._transition(sessionId, event, destination)
          return incommingEvent
        } catch (err) {
          {
            addErrorToEvent(
              {
                type: 'dialog-transition',
                stacktrace: err.stacktrace || err.stack,
                destination
              },
              event
            )

            if (err instanceof InfiniteLoopError) {
              /**
               * In that case we don't even want to transition to error handling flow
               * as risk of another infinite loop is too high.
               * This is major problem and can't be handled softly.
               */
              this.cleanState(event)
              throw err
            }

            const { onErrorFlowTo } = event.state.temp
            const errorFlow =
              typeof onErrorFlowTo === 'string' && onErrorFlowTo.length ? onErrorFlowTo : 'error.flow.json'

            const incommingEvent = await this._transition(sessionId, event, errorFlow)
            return incommingEvent
          }
        }
      }
    } catch (err) {
      this._reportProcessingError(botId, err, event, instruction)
    } finally {
      await converseApiEvents.emitAsync(`action.end.${buildUserKey(event.botId, event.target)}`, event)
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
    try {
      const botId = event.botId
      await this._loadFlows(botId)

      const targetFlow = this._findFlow(botId, targetFlowName)
      const targetNode = targetNodeName
        ? this._findNode(botId, targetFlow, targetNodeName)
        : this._findNode(botId, targetFlow, targetFlow.startNode)

      event.state.__stacktrace.push({ flow: targetFlow.name, node: targetNode.name })
      if (event.state?.context) {
        event.state.context.currentFlow = targetFlow.name
        event.state.context.currentNode = targetNode.name
        event.state.context.queue = undefined
        event.state.context.hasJumped = true
      }
    } catch (err) {
      addErrorToEvent(
        {
          type: 'dialog-engine',
          stacktrace: err.stacktrace || err.stack
        },
        event
      )
      throw err
    }
  }

  private findNodeWithoutError = (botId, flow, nodeName) => {
    try {
      return this._findNode(botId, flow, nodeName)
    } catch (err) {
      // ignore
    }
    return undefined
  }

  private findFlowWithoutError = (botId, flowName) => {
    try {
      return this._findFlow(botId, flowName)
    } catch (err) {
      // ignore
    }
    return undefined
  }

  private fillContextForTransition = (
    event: IO.IncomingEvent,
    {
      currentFlow,
      currentNode,
      nextFlow,
      nextNode
    }: {
      currentFlow: FlowWithParent
      currentNode?: FlowNode
      nextFlow: FlowWithParent
      nextNode: FlowNode
    }
  ) => {
    event.state.context = {
      ...event.state.context,
      currentNode: nextNode.name,
      currentFlow: nextFlow.name,
      queue: undefined,
      previousFlow: currentFlow.name,
      previousNode: currentNode?.name ?? '',
      hasJumped: true,
      jumpPoints: [
        ...(event.state.context?.jumpPoints || []),
        {
          flow: currentFlow.name,
          node: currentNode?.name as string
        }
      ]
    }
  }

  public async processTimeout(botId: string, sessionId: string, event: IO.IncomingEvent) {
    this._debug(event.botId, event.target, 'processing timeout')

    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.BeforeSessionTimeout(api, event))

    await this._loadFlows(botId)

    const currentFlow = this._findFlow(botId, event.state.context?.currentFlow)
    const currentNode = this.findNodeWithoutError(botId, currentFlow, event.state.context?.currentNode)

    // Check for a timeout property in the current node
    let timeoutNode = _.get(currentNode, 'timeout')
    let timeoutFlow: FlowView | undefined = currentFlow

    // Check for a timeout node in the current flow
    if (!timeoutNode) {
      timeoutNode = this.findNodeWithoutError(botId, currentFlow, 'timeout')
    }

    // Check for a timeout property in the current flow
    if (!timeoutNode) {
      const timeoutNodeName = _.get(timeoutFlow, 'timeoutNode')
      if (timeoutNodeName) {
        timeoutNode = this.findNodeWithoutError(botId, timeoutFlow, timeoutNodeName)
      }
    }

    // Check for a timeout.flow.json and get the start node
    if (!timeoutNode) {
      timeoutFlow = this.findFlowWithoutError(botId, 'timeout.flow.json')
      if (timeoutFlow) {
        const startNodeName = timeoutFlow.startNode
        timeoutNode = this.findNodeWithoutError(botId, timeoutFlow, startNodeName)
      }
    }

    if (timeoutNode && timeoutFlow) {
      // There is a timeout node and flow, we jump to it
      this.fillContextForTransition(event, { currentFlow, currentNode, nextFlow: timeoutFlow, nextNode: timeoutNode })
    } else if (!event.state.context?.hasJumped) {
      // If there was no jump, we just return the event to have it's state changes persisted
      return event
    }

    // Process the event with the new context, return to persist state changes
    return this.processEvent(sessionId, event)
  }

  public cleanState(event) {
    event.state.context = {}
    event.state.temp = {}
  }

  public shouldRunConvEnd(event: IO.IncomingEvent): boolean {
    const { name } = this._findFlow(event.botId, event.state.context?.currentFlow)

    if (name === 'timeout.flow.json') {
      this.cleanState(event)
      return false
    } else if (name === 'conversation_end.flow.json') {
      return false
    }

    return true
  }

  // Runs Conversation end hook and returns true if there is transition
  public async runConvEndHook(event: IO.IncomingEvent): Promise<boolean> {
    this._debug(event.botId, event.target, 'processing conversation end hooks')
    const api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.BeforeConversationEnd(api, event))
    if (event.state?.context?.hasJumped) {
      await this.processEvent(event.threadId as string, event)
      return true
    }
    return false
  }

  // Runs Conversation end flow and returns true if there is transition
  public async runConvEndFlow(event: IO.IncomingEvent): Promise<boolean> {
    this._debug(event.botId, event.target, 'processing conversation end flow')
    const { botId, threadId } = event

    const currentFlow = this._findFlow(botId, event.state.context?.currentFlow)
    const currentNode = this.findNodeWithoutError(botId, currentFlow, event.state.context?.currentNode)
    const conversationEndFlow = this.findFlowWithoutError(botId, 'conversation_end.flow.json')

    if (!conversationEndFlow) {
      return false
    }

    const conversationEndNode = this._findNode(botId, conversationEndFlow, conversationEndFlow.startNode)
    this.fillContextForTransition(event, {
      currentFlow,
      currentNode,
      nextFlow: conversationEndFlow,
      nextNode: conversationEndNode
    })

    const previousJumpPointsSize = event.state.context?.jumpPoints?.length
    await this.processEvent(threadId as string, event)

    if (previousJumpPointsSize !== event.state.context?.jumpPoints?.length) {
      return true
    }

    return false
  }

  private async _endFlow(event: IO.IncomingEvent) {
    if (!this.shouldRunConvEnd(event)) {
      return
    }

    // Check if the hooks or flow have a transition, don`t clean state if true
    const shouldWrapup = !(await this.runConvEndHook(event)) && !(await this.runConvEndFlow(event))
    if (shouldWrapup) {
      this.cleanState(event)
    }
  }

  private initializeContext(event) {
    const defaultFlow = this._findFlow(event.botId, event.ndu ? 'misunderstood.flow.json' : 'main.flow.json')
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
    let context: IO.DialogContext = event.state.context || {}
    this.detectInfiniteLoop(event.state.__stacktrace, event.botId)

    context.jumpPoints = context.jumpPoints?.filter(x => !x.used)

    if (transitionTo.includes('.flow.json')) {
      BOTPRESS_CORE_EVENT('bp_core_enter_flow', { botId: event.botId, channel: event.channel, flowName: transitionTo })
      // Transition to other flow
      const nodeIndex = transitionTo.indexOf('#')

      const flow = this._findFlow(event.botId, nodeIndex === -1 ? transitionTo : transitionTo.substring(0, nodeIndex))

      const startNode = this._findNode(
        event.botId,
        flow,
        nodeIndex === -1 ? flow.startNode : transitionTo.substring(nodeIndex + 1)
      )
      event.state.__stacktrace.push({ flow: flow.name, node: startNode.name })

      context = {
        currentFlow: flow.name,
        currentNode: startNode.name,
        // Those two are not used in the backend logic, but keeping them since users rely on them
        previousFlow: event.state.context?.currentFlow,
        previousNode: event.state.context?.currentNode,
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
        event.state.context?.currentFlow,
        event.state.context?.currentNode
      )
    } else if (transitionTo.indexOf('#') === 0) {
      // Return to the parent node (coming from a flow)
      const jumpPoints = context.jumpPoints
      const prevJumpPoint = _.findLast(jumpPoints, j => !j.used)

      if (!jumpPoints || !prevJumpPoint) {
        this._debug(event.botId, event.target, `no previous flow found, current node is ${context.currentNode}`)
        return event
      }

      const executeParentNode = transitionTo.startsWith('##')
      const specificNode = transitionTo.split(executeParentNode ? '##' : '#')[1]

      if (executeParentNode) {
        prevJumpPoint.executeNode = true
      }

      // Multiple transitions on a node triggers each a processEvent, if we simply remove it, the second transition is no longer "exiting a subflow"
      prevJumpPoint.used = true

      const parentFlow = this._findFlow(event.botId, prevJumpPoint.flow)
      const parentNode = this._findNode(event.botId, parentFlow, specificNode || prevJumpPoint.node)

      const builder = new InstructionsQueueBuilder(parentNode, parentFlow)
      const queue = prevJumpPoint.executeNode ? builder.build() : builder.onlyTransitions().build()

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
      this._debug(event.botId, event.target, 'ending flow')
      await this._endFlow(event)
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

  private async _goToSubflow(
    botId: string,
    event: IO.IncomingEvent,
    sessionId: string,
    parentFlow,
    parentNode: FlowNode
  ) {
    const subflowName = parentNode.flow!
    const subflow = this._findFlow(botId, subflowName)
    const subflowStartNode = this._findNode(botId, subflow, subflow.startNode)

    event.state.context = {
      currentFlow: subflow.name,
      currentNode: subflowStartNode.name,
      previousFlow: parentFlow.name,
      previousNode: parentNode.name,
      jumpPoints: [
        ...(event.state.context?.jumpPoints || []),
        {
          flow: parentFlow.name,
          node: parentNode.name
        }
      ]
    }

    return this.processEvent(sessionId, event)
  }

  protected async _loadFlows(botId: string) {
    const flows = await this.flowService.forBot(botId).loadAll()
    this._flowsByBot.set(botId, flows)
  }

  public detectInfiniteLoop(stacktrace: IO.JumpPoint[], botId: string) {
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

    throw new InfiniteLoopError(recurringPath, botId, loop[0].flow, loop[0].node)
  }

  private _findFlow(botId: string, flowName?: string) {
    const flows = this._flowsByBot.get(botId)
    if (!flows || !flowName) {
      throw new FlowError('Could not find any flow.', botId, flowName)
    }

    const fileName = flowName.endsWith('.flow.json') ? flowName : `${flowName}.flow.json`

    const flow = flows.find(x => x.name.toLowerCase() === fileName.toLowerCase())
    if (!flow) {
      throw new FlowError(`Flow not found: ${flowName}`, botId, flowName)
    }
    return flow
  }

  private _findNode(botId: string, flow: FlowView, nodeName: string) {
    const node = flow.nodes && flow.nodes.find(x => x.name === nodeName)
    if (!node) {
      throw new FlowError(`Node not found: ${nodeName}`, botId, flow.name, nodeName)
    }
    return node
  }

  private _reportProcessingError(botId: string, err, event: IO.IncomingEvent, instruction: Instruction) {
    const nodeName = _.get(event, 'state.context.currentNode', 'N/A')
    const flowName = _.get(event, 'state.context.currentFlow', 'N/A')
    const instr = instruction.fn || instruction.type
    const message = `Error processing '${instr}'\nErr: ${err.message}\nBotId: ${botId}\nFlow: ${flowName}\nNode: ${nodeName}`

    if (!err.hideStack) {
      this.logger
        .forBot(botId)
        .attachError(err)
        .warn(message)
    } else {
      this.logger.forBot(botId).warn(message)
    }

    addErrorToEvent(
      {
        type: 'dialog-engine',
        stacktrace: err.stacktrace || err.stack
      },
      event
    )
  }

  private _exitingSubflow(event: IO.IncomingEvent) {
    const { currentFlow, currentNode, jumpPoints } = event.state.context || {}
    const lastJump = jumpPoints?.find(j => j.used)
    const isExiting = lastJump?.flow === currentFlow && lastJump?.node === currentNode

    // When we want to re-process the node, we need to return false so the dialog engine processes the node from the start
    if (lastJump?.executeNode) {
      return false
    }
    return isExiting
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
