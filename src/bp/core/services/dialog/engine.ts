import { IO, Logger } from 'botpress/sdk'
import { DialogSession } from 'core/repositories'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { FlowNavigator, NavigationArgs, NavigationPosition } from './flow/navigator'
import { FlowService } from './flow/service'
import { Instruction } from './instruction'
import { InstructionFactory } from './instruction/factory'
import { InstructionProcessor } from './instruction/processor'
import { InstructionQueue } from './instruction/queue'
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

const DEFAULT_FLOW_NAME = 'main.flow.json'

@injectable()
export class DialogEngine {
  onProcessingError: ((err: ProcessingError) => void) | undefined

  constructor(
    @inject(TYPES.FlowNavigator) private flowNavigator: FlowNavigator,
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.SessionService) private sessionService: SessionService,
    @inject(TYPES.Logger)
    @tagged('name', 'DialogEngine')
    private logger: Logger
  ) {}

  /**
   * The main entry point to the Dialog Engine....
   * @param sessionId The ID that will identify the session. Generally the user ID
   * @param event The incoming botpress event
   */
  async processEvent(sessionId: string, event: IO.Event) {
    const session = await this.getOrCreateSession(sessionId, event.botId, event)
    const flows = await this.flowService.loadAll(event.botId)
    await this.processSession(event.botId, session, flows)
  }

  protected async getOrCreateSession(sessionId, botId, event): Promise<DialogSession> {
    const flows = await this.flowService.loadAll(botId)
    const defaultFlow = flows.find(f => f.name === DEFAULT_FLOW_NAME)
    let skillEntryNode
    let skillFlow

    if (!defaultFlow) {
      throw new Error(`Default flow "${DEFAULT_FLOW_NAME}" not found for bot "${botId}"`)
    }

    const entryNodeName = defaultFlow.startNode
    const entryNode = defaultFlow.nodes.find(n => n.name === entryNodeName)
    if (entryNode && entryNode.type === 'skill-call') {
      const flow = flows.find(f => f.name === entryNode.flow)
      skillEntryNode = flow && flow.startNode
      skillFlow = flow
    }

    let session: DialogSession = await this.sessionService.getOrCreateSession(sessionId, botId)
    session = await this.sessionService.updateSessionEvent(session.id, event)

    if (!session.context!.currentNodeName) {
      const context = {
        previousNodeName: session.context!.previousNodeName ? session.context!.previousNodeName : entryNodeName,
        previousFlowName: skillFlow && skillFlow.name ? defaultFlow.name : undefined,
        currentFlowName: (skillFlow && skillFlow.name) || defaultFlow.name,
        currentNodeName: skillEntryNode || entryNodeName
      }
      session = await this.sessionService.updateSessionContext(session.id, context)
    }

    if (!session.context!.queue) {
      const currentFlow = this.getCurrentFlow(session, flows)
      const currentNode = this.getCurrentNode(session, flows)
      const queue = this.createQueue(currentNode, currentFlow)
      const context = session.context!
      context.queue = queue.toString()
      session = await this.sessionService.updateSessionContext(session.id, context)
    }

    return session
  }

  async jumpTo(sessionId: string, event: any, flowName: string, nodeName?: string) {
    const flows = await this.flowService.loadAll(event.botId)
    const targetFlow = flows.find(f => f.name === flowName)
    let targetNode

    if (nodeName) {
      targetNode = targetFlow!.nodes.find(n => n.name === nodeName)
      if (!targetNode) {
        throw new Error(`The target node "${nodeName}" doesnt exists in the provided flow "${flowName}"`)
      }
    }

    if (!targetNode) {
      const startNodeName = targetFlow!.startNode
      targetNode = targetFlow!.nodes.find(n => n.name === startNodeName)
    }

    const session = await this.getOrCreateSession(sessionId, event.botId, event)
    const queue = this.createQueue(targetNode, targetFlow)

    const context = {
      previousFlowName: session.context!.currentFlowName,
      currentFlowName: targetFlow!.name,
      currentNodeName: targetNode.name,
      queue: queue.toString()
    }
    await this.sessionService.updateSessionContext(session.id, context)
  }

  protected async processSession(botId, session, flows) {
    let queue = new InstructionQueue(session.context!.queue)
    let sessionIsStale = false

    while (queue.hasInstructions()) {
      const instruction = queue.dequeue()!

      if (sessionIsStale) {
        session = await this.sessionService.getSession(session.id)
        sessionIsStale = false
      }

      try {
        const result = await this.instructionProcessor.process(botId, instruction, session)

        if (result.followUpAction === 'update') {
          await this.updateQueueForSession(queue, session)
          await this.sessionService.updateStateForSession(session.id, result.options!.state!)
          sessionIsStale = true
        } else if (result.followUpAction === 'none') {
          await this.updateQueueForSession(queue, session)
        } else if (result.followUpAction === 'wait') {
          await this.updateQueueForSession(queue, session)
          break
        } else if (result.followUpAction === 'transition') {
          sessionIsStale = true

          const position = await this.navigateToNextNode(flows, session, result.options!.transitionTo!)
          if (!position) {
            this.sessionService.deleteSession(session.id)
            break
          }

          const flow = flows.find(f => f.name === position.flowName)
          const node = flow!.nodes.find(n => n.name === position.nodeName)

          // Check to exit subflow
          if (_.get(result, 'options.transitionTo') === '#' && session.context.previousFlowName === position.flowName) {
            queue = this.createQueue(node, flow, { onlyTransitions: true })
          } else {
            queue = this.createQueue(node, flow)
          }

          const context = {
            previousNodeName: position.previousNode ? position.previousNode : session.context.previousNodeName,
            previousFlowName: session.context.previousFlowName || session.context.currentFlowName,
            currentFlowName: position.flowName,
            currentNodeName: position.nodeName,
            queue: queue.toString()
          }

          await this.sessionService.updateSessionContext(session.id, context)
        }
      } catch (err) {
        queue = this.rebuildQueue(flows, instruction, session)
        await this.updateQueueForSession(queue, session)
        this.reportProcessingError(botId, err, session, instruction)
        break
      }
    }

    if (!queue.hasInstructions()) {
      await this.sessionService.deleteSession(session.id)
    }
  }

  async processTimeout(botId: string, sessionId: string): Promise<void> {
    const flows = await this.flowService.loadAll(botId)
    const session = await this.sessionService.getSession(sessionId)
    const currentFlow = this.getCurrentFlow(session, flows)
    const currentNode = this.getCurrentNode(session, flows)

    let timeoutNode = _.get(currentNode, 'timeout')
    let timeoutFlow = currentFlow

    if (!timeoutNode || !timeoutFlow) {
      timeoutNode = timeoutFlow.nodes.find(n => n.name === 'timeout')
    }
    if (!timeoutNode || !timeoutFlow) {
      timeoutNode = _.get(currentFlow, 'timeout')
    }
    if (!timeoutNode || !timeoutFlow) {
      timeoutFlow = flows.find(f => f.name === 'timeout.flow.json')
      if (timeoutFlow) {
        const entryNodeName = _.get(timeoutFlow, 'startNode')
        timeoutNode = timeoutFlow.nodes.find(n => n.name === entryNodeName)
      }
    }

    if (!timeoutNode || !timeoutFlow) {
      throw new Error(`Could not find any timeout node for session "${sessionId}"`)
    }

    const queue = this.createQueue(timeoutNode, timeoutNode)
    const updatedSession = await this.sessionService.updateSessionContext(session.id, {
      previousFlowName: session.context!.currentFlowName,
      currentFlowName: timeoutFlow.name,
      currentNodeName: timeoutNode.name,
      queue: queue.toString()
    })

    await this.processSession(botId, updatedSession, flows)
  }

  private async updateQueueForSession(queue: InstructionQueue, session: DialogSession) {
    const context = session.context!
    context.queue = queue.toString()
    await this.sessionService.updateSessionContext(session.id, context)
  }

  private getCurrentFlow(session, flows) {
    const flowName = _.get(session, 'context.currentFlowName')
    return flows.find(f => f.name === flowName)
  }

  private getCurrentNode(session, flows) {
    const nodeName = _.get(session, 'context.currentNodeName')
    const currentFlow = this.getCurrentFlow(session, flows)
    return currentFlow.nodes.find(n => n.name === nodeName)
  }

  private rebuildQueue(flows, instruction, session) {
    const currentFlow = this.getCurrentFlow(session, flows)
    const currentNode = this.getCurrentNode(session, flows)

    return instruction.type === 'on-enter'
      ? this.createQueue(currentNode, currentFlow)
      : this.createQueue(currentNode, currentFlow, { skipOnEnter: true })
  }

  protected createQueue(
    currentNode,
    currentFlow,
    options: { skipOnEnter?: boolean; onlyTransitions?: boolean } = { skipOnEnter: false, onlyTransitions: false }
  ) {
    const queue = new InstructionQueue()

    if (!options.onlyTransitions) {
      if (!options.skipOnEnter) {
        const onEnter = InstructionFactory.createOnEnter(currentNode)
        queue.enqueue(...onEnter)
      }

      const onReceive = InstructionFactory.createOnReceive(currentNode, currentFlow)
      if (!_.isEmpty(onReceive)) {
        queue.enqueue({ type: 'wait' })
      }
      queue.enqueue(...onReceive)
    }

    const transition = InstructionFactory.createTransition(currentNode, currentFlow)

    queue.enqueue(...transition)

    return queue
  }

  private async navigateToNextNode(
    flows,
    session: DialogSession,
    destination: string
  ): Promise<NavigationPosition | undefined> {
    if (destination === 'END') {
      await this.sessionService.deleteSession(session.id)
      return undefined
    }

    const navigationArgs: NavigationArgs = {
      previousNodeName: session.context!.previousNodeName!,
      previousFlowName: session.context!.previousFlowName!,
      currentFlowName: session.context!.currentFlowName,
      currentNodeName: session.context!.currentNodeName,
      flows: flows,
      destination: destination
    }
    return this.flowNavigator.navigate(navigationArgs)
  }

  private reportProcessingError(botId: string, error: Error, session: DialogSession, instruction: Instruction) {
    const nodeName = _.get(session, 'context.currentNodeName', 'N/A')
    const flowName = _.get(session, 'context.currentFlowName', 'N/A')
    const instructionDetails = instruction.fn || instruction.type
    this.onProcessingError &&
      this.onProcessingError(new ProcessingError(error.message, botId, nodeName, flowName, instructionDetails))
  }
}
