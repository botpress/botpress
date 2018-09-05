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

    const session = await this.sessionService.getOrCreateSession(sessionId)
    this.sessionService.updateSessionEvent(session.id, event)

    if (session.hasEmptyNode()) {
      this.sessionService.updateSessionContext(session.id, {
        currentFlowName: defaultFlow.name,
        currentNodeName: entryNodeName
      })
    }

    if (session.hasEmptyQueue()) {
      const currentFlow = this.getCurrentFlow(session, flows)
      const currentNode = this.getCurrentNode(session, flows)
      const queue = this.createQueue(currentNode, currentFlow)
      await this.sessionService.updateSessionContext(session.id, {
        currentFlowName: currentFlow.name,
        currentNodeName: currentNode.name,
        queue: queue
      })
    }

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
          break
        } else if (result.followUpAction === 'transition') {
          queue.clear()
          const position = await this.navigateToNextNode(flows, queue, result.transitionTo)
        } else if (result.followUpAction === 'none') {
          // continue
        }
      } catch (err) {
        this.reportProcessingError(err, session, instruction)
        queue = this.rebuildQueue(flows, instruction, session)
      } finally {
        session.context.queue = queue
        this.sessionService.updateSession(session)
      }
    }
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

    const queue =
      instruction.type === 'on-enter'
        ? this.createQueue(currentNode, currentFlow)
        : this.createQueue(currentNode, currentFlow, skipOnEnter)
    queue.wait()
  }

  protected createQueue(currentNode, currentFlow, skipOnEnter = false) {
    const queue = new InstructionQueue()

    if (skipOnEnter) {
      const onEnter = InstructionFactory.createOnEnter(currentNode)
      queue.enqueue(...onEnter)
    }

    const onReceive = InstructionFactory.createOnReceive(currentNode, currentFlow)
    const transition = InstructionFactory.createTransition(currentNode, currentFlow)

    if (!_.isEmpty(onReceive)) {
      queue.wait()
    }

    queue.enqueue(...onReceive)
    queue.enqueue(...transition)
    return queue
  }

  private async navigateToNextNode(flows, session, destination): Promise<NavigationPosition> {
    const navigationArgs: NavigationArgs = {
      previousFlowName: _.get(session, ['context.previousFlowName']),
      previousNodeName: _.get(session, ['context.previousFlowName']),
      currentFlowName: _.get(session, ['context.currentFlowName']),
      currentNodeName: _.get(session, ['context.currentNodeName']),
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
