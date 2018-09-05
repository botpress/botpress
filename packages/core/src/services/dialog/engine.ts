import { BotpressEvent } from 'botpress-module-sdk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../../misc/types'
import { DialogSession } from '../../repositories/session-repository'

import { FlowNavigator, NavigationArgs, NavigationPosition } from './flow/navigator'
import FlowService from './flow/service'
import { Instruction } from './instruction'
import { InstructionFactory } from './instruction/factory'
import { InstructionProcessor } from './instruction/processor'
import { InstructionQueue } from './instruction/queue'
import { SessionService } from './session/service'

export class ProcessingError extends Error {
  constructor(
    message: string,
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
    @inject(TYPES.SessionService) private sessionService: SessionService
  ) {}

  /**
   * The main entry point to the Dialog Engine....
   * @param sessionId The ID that will identify the session. Generally the user ID
   * @param event The incoming botpress event
   */
  async processEvent(botId: string, sessionId: string, event: BotpressEvent) {
    const flows = await this.flowService.loadAll(botId)
    const defaultFlow = flows.find(f => f.name === DEFAULT_FLOW_NAME)!
    const entryNodeName = _.get(defaultFlow, 'startNode')!

    let session: DialogSession = await this.sessionService.getOrCreateSession(sessionId)
    session = await this.sessionService.updateSessionEvent(session.id, event)

    if (!session.context!.currentNodeName) {
      session = await this.sessionService.updateSessionContext(session.id, {
        currentFlowName: defaultFlow.name,
        currentNodeName: entryNodeName
      })
    }

    if (!session.context!.queue) {
      const currentFlow = this.getCurrentFlow(session, flows)
      const currentNode = this.getCurrentNode(session, flows)
      const queue = this.createQueue(currentNode, currentFlow)
      session = await this.sessionService.updateSessionContext(session.id, {
        currentFlowName: currentFlow.name,
        currentNodeName: currentNode.name,
        queue: queue.toString()
      })
    }

    let queue = new InstructionQueue(session.context!.queue)

    while (queue.hasInstructions()) {
      const instruction = queue.dequeue()!
      console.log('Instruction = ', instruction.type, instruction.fn)
      try {
        const result = await this.instructionProcessor.process(
          botId,
          instruction,
          session.state,
          session.event,
          session.context
        )

        console.log('Result = ', result.followUpAction, result.transitionTo)

        if (result.followUpAction === 'wait') {
          await this.updateQueueForSession(queue, session)
          break
        } else if (result.followUpAction === 'transition') {
          queue.clear()

          const position = await this.navigateToNextNode(flows, session, result.transitionTo)
          const flow = flows.find(f => f.name === position.flowName)
          const node = flow!.nodes.find(n => n.name === position.nodeName)
          queue = this.createQueue(node, flow)

          this.sessionService.updateSessionContext(session.id, {
            previousFlowName: session.context!.currentFlowName,
            previousNodeName: session.context!.currentNodeName,
            currentFlowName: position.flowName,
            currentNodeName: position.nodeName,
            queue: queue.toString()
          })
        } else if (result.followUpAction === 'none') {
          await this.updateQueueForSession(queue, session)
        }
      } catch (err) {
        queue = this.rebuildQueue(flows, instruction, session)
        await this.updateQueueForSession(queue, session)
        this.reportProcessingError(err, session, instruction)
        break
      }
    }
  }

  private async updateQueueForSession(queue: InstructionQueue, session: DialogSession) {
    const context = session.context!
    context.queue = queue.toString()
    await this.sessionService.updateSessionContext(session.id, context)
  }

  private getCurrentFlow(session, flows) {
    const flowName = _.get(session, 'context.currentFlowName')
    return flows.find(f => f.name === flowName)!
  }

  private getCurrentNode(session, flows) {
    const nodeName = _.get(session, 'context.currentNodeName')
    const currentFlow = this.getCurrentFlow(session, flows)
    return currentFlow.nodes.find(n => n.name === nodeName)
  }

  private rebuildQueue(flows, instruction, session) {
    const currentFlow = this.getCurrentFlow(session, flows)
    const currentNode = this.getCurrentNode(session, flows)
    const skipOnEnter = true

    return instruction.type === 'on-enter'
      ? this.createQueue(currentNode, currentFlow)
      : this.createQueue(currentNode, currentFlow, skipOnEnter)
  }

  protected createQueue(currentNode, currentFlow, skipOnEnter = false) {
    const queue = new InstructionQueue()

    if (!skipOnEnter) {
      const onEnter = InstructionFactory.createOnEnter(currentNode)
      queue.enqueue(...onEnter)
    }

    const onReceive = InstructionFactory.createOnReceive(currentNode, currentFlow)
    const transition = InstructionFactory.createTransition(currentNode, currentFlow)

    if (!_.isEmpty(onReceive)) {
      queue.enqueue({ type: 'wait' })
    }

    queue.enqueue(...onReceive)
    queue.enqueue(...transition)

    return queue
  }

  private async navigateToNextNode(flows, session: DialogSession, destination): Promise<NavigationPosition> {
    const navigationArgs: NavigationArgs = {
      previousFlowName: session.context!.previousFlowName!,
      previousNodeName: session.context!.previousNodeName!,
      currentFlowName: session.context!.currentFlowName,
      currentNodeName: session.context!.currentNodeName,
      flows: flows,
      destination: destination
    }
    return this.flowNavigator.navigate(navigationArgs)
  }

  private reportProcessingError(error: Error, session: DialogSession, instruction: Instruction) {
    const nodeName = _.get(session, 'context.currentNodeName', 'N/A')
    const flowName = _.get(session, 'context.currentFlowName', 'N/A')
    const instructionDetails = instruction.fn || instruction.type
    this.onProcessingError &&
      this.onProcessingError(new ProcessingError(error.message, nodeName, flowName, instructionDetails))
  }
}
