import { BotpressEvent } from 'botpress-module-sdk'
import { inject, injectable, postConstruct } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../../misc/types'
import { DialogSession } from '../../repositories/session-repository'

import { FlowNavigator } from './flow-navigator'
import FlowService from './flow-service'
import { Instruction, InstructionProcessor } from './instruction-processor'
import { InstructionQueue } from './instruction-queue'
import { SessionService } from './session-service'

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

@injectable()
export class DialogEngine {
  onProcessingError: ((err: ProcessingError) => void) | undefined

  // Persist or in-memory??
  private queuesBySessions: Map<string, InstructionQueue> = new Map()

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
    const defaultFlow = await this.flowService.findDefaultFlow(botId)
    const entryNode = this.flowService.findEntryNode(defaultFlow)
    const session = await this.sessionService.getOrCreateSession(sessionId, event, defaultFlow, entryNode)

    // Or session.context.queue

    let queue = this.queuesBySessions.get(sessionId)
    if (!queue) {
      queue = new InstructionQueue()
      queue.createFromContext(session.context)
      this.queuesBySessions.set(sessionId, queue)
    }

    while (queue.hasInstructions()) {
      const instruction = queue.dequeue()!
      console.log('Instruction = ', instruction.type, instruction.fn)
      try {
        const result = await this.instructionProcessor.process(
          instruction,
          session.state,
          session.event,
          session.context
        )

        console.log('Result = ', result.followUpAction, result.options && result.options.transitionTo)

        if (result.followUpAction === 'wait') {
          break
        } else if (result.followUpAction === 'transition') {
          queue.clear()
          await this.navigateToNextNode(botId, session, result.options!.transitionTo)
        } else if (result.followUpAction === 'none') {
          // continue
        }
      } catch (err) {
        instruction.type === 'on-enter'
          ? queue.createFromContext(session.context)
          : queue.createFromContext(session.context, { skipOnEnter: true })
        this.reportProcessingError(err, session, instruction)
      } finally {
        this.queuesBySessions.set(sessionId, queue)
      }
    }
  }

  private async navigateToNextNode(botId, session, target) {
    const updatedSession = await this.flowNavigator.navigate(botId, target, session)
    await this.sessionService.updateSession(updatedSession)
  }

  private reportProcessingError(error: Error, session: DialogSession, instruction: Instruction) {
    const nodeName = _.get(session, 'context.currentNode.name', 'N/A')
    const flowName = _.get(session, 'context.currentFlow.name', 'N/A')
    const instructionDetails = instruction.fn || instruction.type
    this.onProcessingError &&
      this.onProcessingError(new ProcessingError(error.message, nodeName, flowName, instructionDetails))
  }
}
