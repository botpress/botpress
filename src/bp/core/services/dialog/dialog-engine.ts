import { BoxedVariable, Content, FlowNode, IO, Logger, VariableParams } from 'botpress/sdk'
import { parseFlowName } from 'common/flow'
import { FlowView } from 'common/typings'
import { createForGlobalHooks } from 'core/api'
import { EventRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { converseApiEvents } from '../converse'
import { Hooks, HookService } from '../hook/hook-service'
import { DialogStore } from '../middleware/dialog-store'
import { addErrorToEvent } from '../middleware/event-collector'
import { EventEngine } from '../middleware/event-engine'

import { FlowError, TimeoutNodeNotFound } from './errors'
import { FlowService } from './flow/service'
import { Instruction } from './instruction'
import { InstructionProcessor } from './instruction/processor'
import { InstructionQueue } from './instruction/queue'
import { PromptManager } from './prompt-manager'
import { InstructionsQueueBuilder } from './queue-builder'

const debug = DEBUG('dialog')

@injectable()
export class DialogEngine {
  private _flowsByBot: Map<string, FlowView[]> = new Map()

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'DialogEngine')
    private logger: Logger,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.EventRepository) private eventRepository: EventRepository,
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor,
    @inject(TYPES.PromptManager) private promptManager: PromptManager,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.DialogStore) private dialogStore: DialogStore
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

      if (currentWorkflow !== workflowName || !event.state.session.workflows?.[workflowName]) {
        this.changeWorkflow(event, workflowName)
        event.state.session.currentWorkflow = workflowName
      }

      const workflowEnded = currentNode.type === 'success' || currentNode.type === 'failure'
      if (workflowEnded && workflow) {
        workflow.success = currentNode.type === 'success'
      }

      if (currentNode.type === 'prompt' && !context.activePrompt && !this._getCurrentNodeValue(event, 'processed')) {
        this._appendActivePromptToContext(currentNode, context)
      }

      if (context.activePrompt && !event.state.__stacktrace.length) {
        event.state.__stacktrace.push({ flow: currentFlow.name, node: currentNode.name })
      }

      if (context.activePrompt?.status === 'pending') {
        const listenEvent = await this._processPendingPrompt(event, context)
        if (listenEvent) {
          return listenEvent
        }
      }

      if (context.activePrompt?.status === 'resolved') {
        this._processResolvedPrompt(event, context)
      }

      if (context.activePrompt?.status === 'rejected') {
        const jumped = await this._processRejectedPrompt(event, context, sessionId, currentFlow.name)
        if (jumped) {
          return this.processEvent(sessionId, event)
        }
      }

      if (context.activePrompt) {
        this._setCurrentNodeValue(event, 'processed', true)
        delete context.activePrompt
      }
    }

    // Property type skill-call means that the node points to a subflow.
    // We skip this step if we're exiting from a subflow, otherwise it will result in an infinite loop.
    if (['skill-call', 'sub-workflow'].includes(currentNode.type!)) {
      if (!this._exitingSubflow(event)) {
        return this._goToSubflow(botId, event, sessionId, currentFlow, currentNode)
      } else {
        const subFlow = this._findFlow(botId, currentNode.flow!)
        this.copyVarsToParent(subFlow, currentNode, event)
        // TODO remove this hack
        event.state.session.nduContext!.last_topic = parseFlowName(context.currentFlow!).topic!
        event.state.session.workflows = _.omitBy(event.state.session.workflows, x => x.status === 'completed')
      }
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
          addErrorToEvent(
            {
              type: 'dialog-transition',
              stacktrace: err.stacktrace || err.stack,
              destination: destination
            },
            event
          )

          const { onErrorFlowTo } = event.state.temp
          const errorFlow =
            typeof onErrorFlowTo === 'string' && onErrorFlowTo.length ? onErrorFlowTo : 'error.flow.json'

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

  public changeWorkflow(event: IO.IncomingEvent, nextFlowName: string) {
    const { currentWorkflow, workflows } = event.state.session
    const { workflow } = event.state

    const nextFlow = this._findFlow(event.botId, `${nextFlowName}.flow.json`)
    const isSubFlow = nextFlow.type === 'reusable'

    // This workflow doesn't already exist, so we add it
    if (!workflow) {
      event.state.session.workflows = _.omitBy(event.state.session.workflows, x => x.status === 'completed')

      BOTPRESS_CORE_EVENT('bp_core_workflow_started', {
        botId: event.botId,
        channel: event.channel,
        wfName: nextFlowName
      })

      event.state.session.workflows = {
        ...event.state.session.workflows,
        [nextFlowName]: {
          eventId: event.id,
          status: 'active',
          variables: {}
        }
      }
      return
    }

    // We dive one level deeper (one more child)
    if (isSubFlow) {
      BOTPRESS_CORE_EVENT('bp_core_workflow_started', {
        botId: event.botId,
        channel: event.channel,
        wfName: nextFlowName
      })

      // The parent flow is inactive for now
      workflow.status = 'pending'

      event.state.session.workflows = {
        ...event.state.session.workflows,
        [nextFlowName]: {
          eventId: event.id,
          status: 'active',
          parent: currentWorkflow,
          variables: {}
        }
      }

      this.sendVarsToChild(nextFlow, event)
    } else {
      workflow.status = 'completed'

      // If the current workflow has a parent, and we return there, we update its status
      if (workflow.parent && workflows[nextFlowName]) {
        workflows[nextFlowName].status = 'active'
      }
    }
  }

  private copyVarsToParent(childFlow: FlowView, callerNode: FlowNode, event: IO.IncomingEvent) {
    const { workflows } = event.state.session

    const outputs = callerNode.subflow?.out
    const childOutputVars = childFlow.variables?.filter(x => x.params.isOutput)
    const childBoxedVars = workflows[parseFlowName(childFlow.name).workflowPath!]?.variables

    if (!outputs || !childOutputVars || !childBoxedVars) {
      return
    }

    childOutputVars.forEach(v => {
      const ouputVarName = outputs[v.params.name]
      const childBoxedVar = childBoxedVars[v.params.name] as BoxedVariable<any>

      if (ouputVarName && childBoxedVar) {
        const { value, type, subType } = childBoxedVar
        const params = { name: ouputVarName, value, type, subType }
        this.createVariable(params, event)
      }
    })
  }

  private sendVarsToChild(childFlow: FlowView, event: IO.IncomingEvent) {
    const { workflow } = event.state

    const inputs = event.state.context.inputs
    const childInputVars = childFlow.variables?.filter(x => x.params.isInput)
    const currentBoxedVars = workflow.variables

    if (!inputs || !childInputVars || !currentBoxedVars) {
      return
    }

    childInputVars.forEach(v => {
      const input = inputs[v.params.name]
      if (!input) {
        return
      }

      let value = input.value
      if (input.source === 'variable') {
        value = currentBoxedVars[input.value]?.value
      }

      if (value !== undefined) {
        const flowName = parseFlowName(childFlow.name).workflowPath
        const params = {
          name: v.params.name,
          value,
          subType: v.params.subType,
          type: v.type,
          options: { nbOfTurns: 10, specificWorkflow: flowName }
        }
        try {
          this.createVariable(params, event)
        } catch (e) {
          // TODO: handle error gracefully here
        }
      }
    })
  }

  private _setCurrentNodeValue(event: IO.IncomingEvent, variable: string, value: any) {
    const { currentFlow, currentNode } = event.state.context
    _.set(event.state.temp, `[${currentFlow!.replace('.flow.json', '')}/${currentNode}].${variable}`, value)
  }

  private _getCurrentNodeValue(event: IO.IncomingEvent, variable: string): any {
    const { currentFlow, currentNode } = event.state.context
    return _.get(event.state.temp, `[${currentFlow!.replace('.flow.json', '')}/${currentNode}].${variable}`)
  }

  public async jumpTo(sessionId: string, event: IO.IncomingEvent, targetFlowName: string, targetNodeName?: string) {
    const prompt = event.state.context?.activePrompt
    if (prompt) {
      if (!prompt.config.cancellable) {
        return
      }

      if (prompt.config.confirmCancellation && prompt.stage !== 'confirm-jump') {
        prompt.stage = 'confirm-jump'
        prompt.state.nextDestination = { flowName: targetFlowName, node: targetNodeName! }

        return
      }

      delete event.state.context.activePrompt
    }

    try {
      const botId = event.botId
      await this._loadFlows(botId)

      const targetFlow = this._findFlow(botId, targetFlowName)
      const targetNode = targetNodeName
        ? this._findNode(botId, targetFlow, targetNodeName)
        : this._findNode(botId, targetFlow, targetFlow.startNode)

      event.state.__stacktrace.push({ flow: targetFlow.name, node: targetNode.name })
      event.state.context.currentFlow = targetFlow.name
      event.state.context.currentNode = targetNode.name
      event.state.context.queue = undefined
      event.state.context.hasJumped = true
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

  public async processTimeout(botId: string, sessionId: string, event: IO.IncomingEvent, isPrompt?: boolean) {
    this._debug(event.botId, event.target, 'processing timeout')

    if (isPrompt) {
      this._setCurrentNodeValue(event, 'timeout', true)
      delete event.state.context.activePrompt
      return this.processEvent(sessionId, event)
    }

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

    if (event.state.workflow) {
      event.state.workflow.status = 'completed'
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
    let context: IO.DialogContext = event.state.context
    if (!event.activeProcessing?.errors?.length) {
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
      const isInSubFlow = context.currentFlow?.startsWith('skills/') || flowInfo.type === 'reusable'
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

    // TODO remove this hack
    event.state.session.nduContext!.last_topic = parseFlowName(subflowName).topic!

    event.state.context = {
      inputs: parentNode.subflow?.in,
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
    const { currentFlow, currentNode, jumpPoints } = event.state.context
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

  private _getPreviousEvents(target: string, searchBackCount: number) {
    if (!searchBackCount) {
      return []
    }

    return this.eventRepository
      .findEvents(
        { direction: 'incoming', target },
        {
          count: searchBackCount,
          sortOrder: [{ column: 'createdOn', desc: true }]
        }
      )
      .then(events => events.map(x => <IO.IncomingEvent>x.event))
  }

  private _appendActivePromptToContext(currentNode: FlowNode, context: IO.DialogContext) {
    const { type, params } = currentNode.prompt!
    context.activePrompt = {
      stage: 'new',
      status: 'pending',
      state: {},
      turn: 0,
      config: {
        type,
        valueType: this.dialogStore.getPromptConfig(type)?.valueType,
        ...params
      }
    }
  }

  private async _processPendingPrompt(
    event: IO.IncomingEvent,
    context: IO.DialogContext
  ): Promise<IO.IncomingEvent | undefined> {
    const { searchBackCount } = context.activePrompt!.config
    const previousEvents =
      context.activePrompt!.stage === 'new' && searchBackCount > 1
        ? await this._getPreviousEvents(event.target, searchBackCount - 1)
        : []

    const { status: promptStatus, actions } = await this.promptManager.processPrompt(event, previousEvents)
    context.activePrompt = promptStatus

    for (const { type, payload, message, eventType } of actions) {
      if (type === 'say') {
        const incomingEventId = event.id

        if (payload) {
          await this.eventEngine.replyContentToEvent(payload, event, { incomingEventId, eventType })
        } else if (message) {
          const text: Content.Text = {
            type: 'text',
            text: message
          }

          await this.eventEngine.replyContentToEvent(text, event, { incomingEventId })
        }
      }

      if (type === 'listen') {
        return event
      }

      if (type === 'cancel') {
        this._setCurrentNodeValue(event, 'cancelled', true)
      }
    }
  }

  private _processResolvedPrompt(event: IO.IncomingEvent, context: IO.DialogContext) {
    const { config, state } = context.activePrompt!

    if (state.electedCandidate) {
      context.pastPromptCandidates = [...(context.pastPromptCandidates || []), state.electedCandidate]
    }

    this.createVariable(
      {
        name: config.output,
        value: state.value,
        type: config.valueType!,
        subType: config.subType,
        options: {
          nbOfTurns: config.duration ?? 10
        }
      },
      event
    )

    this._setCurrentNodeValue(event, 'extracted', true)
  }

  private async _processRejectedPrompt(
    event: IO.IncomingEvent,
    context: IO.DialogContext,
    sessionId: string,
    currentFlowName: string
  ): Promise<boolean> {
    this._setCurrentNodeValue(event, context.activePrompt!.rejection!, true)

    if (context.activePrompt!.rejection === 'jumped') {
      const { nextDestination } = context.activePrompt!.state
      if (nextDestination) {
        const { flowName, node } = nextDestination
        await this.jumpTo(sessionId, event, flowName, node)

        return true
      } else {
        throw new FlowError('No destination set for jump to instruction', event.botId, currentFlowName)
      }
    }
    return false
  }

  public createVariable({ name, value, type, subType, options }: VariableParams, event: IO.IncomingEvent) {
    const workflowName = options?.specificWorkflow ?? event.state.session.currentWorkflow!
    const wf = event.state.session.workflows[workflowName]
    if (!wf) {
      return
    }

    const { nbOfTurns, config } = options ?? {}
    const data = { type, subType, value, nbOfTurns: nbOfTurns ?? 10, config }

    wf.variables[name] = this.dialogStore.getBoxedVar(data, event.botId, workflowName, name)!
  }
}
