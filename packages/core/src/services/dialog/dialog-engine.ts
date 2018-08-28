import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { DialogSession } from '../../repositories/session-repository'

import FlowService from './flow-service'
import { Instruction, InstructionProcessor } from './instruction-processor'
import { SessionService } from './session-service'

// TODO: Allow multi-bot
const BOT_ID = 'bot123'
const DEFAULT_FLOW_NAME = 'main.flow.json'
const ENTRY_NODE_NAME = 'entry'
const MAX_FAILED_ATTEMPS = 10

@injectable()
export class NewDialogEngine {
  private instructionQueue: Instruction[] = []
  private flows: any[] = []

  private flowsLoaded = false
  private currentSession!: DialogSession
  private failedAttempts = 0

  constructor(
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.SessionService) private sessionService: SessionService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  /**
   * The main entry point to the Dialog Engine....
   * @param sessionId The ID that will identify the session. Generally the user ID
   * @param event The incoming botpress event
   */
  async processMessage(sessionId, event) {
    if (!this.flowsLoaded) {
      this.reloadFlows()
    }

    this.currentSession = await this.getOrCreateSession(sessionId, event)
    this.fillQueue()
    await this.executeQueue()
  }

  private async getOrCreateSession(sessionId, event): Promise<DialogSession> {
    const session = await this.sessionService.getSession(sessionId)
    if (!session) {
      const defaultFlow = this.findDefaultFlow()
      const entryNode = this.findEntryNode(defaultFlow)

      return this.sessionService.createSession(sessionId, defaultFlow, entryNode, event)
    }
    return session
  }

  private fillQueue() {
    const context = JSON.parse(this.currentSession.context)
    const onEnter = this.createOnEnters(context)
    const onReceive = this.createOnReceives(context)
    const next = this.createConditions(context)

    this.instructionQueue.push(...onEnter)

    if (_.isEmpty(onReceive)) {
      // Wait for next message
    }

    this.instructionQueue.push(...onReceive, ...next)
  }

  private createOnEnters(context): Instruction[] {
    const instructions = context.currentNode && context.currentNode.onEnter
    if (!instructions) {
      return []
    }

    return instructions.map(x => {
      return { type: 'on-enter', fn: x }
    })
  }

  private createOnReceives(context): Instruction[] {
    const instructions = context.currentNode && context.currentNode.onReceive
    if (!instructions) {
      return []
    }

    return instructions.map(x => {
      return { type: 'on-receive', fn: x }
    })
  }

  private createConditions(context): Instruction[] {
    const instructions = context.currentNode && context.currentNode.next
    if (!instructions) {
      return []
    }

    return instructions.map(x => {
      return { type: 'transition-condition', fn: x.condition }
    })
  }

  private async executeQueue() {
    this.instructionQueue.reverse() // To act as a queue

    while (!_.isEmpty(this.instructionQueue)) {
      const instruction = this.instructionQueue.pop()!
      const result = await this.instructionProcessor.process(
        instruction,
        this.currentSession.state,
        this.currentSession.event,
        this.currentSession.context
      )

      if (!result) {
        this.failedAttempts++
        if (this.checkForFailedAttempts()) {
          throw new Error('Too many instructions failed')
        }
        this.instructionQueue.push(instruction)
      }

      this.resetFailedAttempts()
    }
  }

  private resetFailedAttempts() {
    this.failedAttempts = 0
  }

  private checkForFailedAttempts() {
    return this.failedAttempts >= MAX_FAILED_ATTEMPS
  }

  private async reloadFlows(): Promise<void> {
    this.flows = await this.flowService.loadAll(BOT_ID)
    this.flowsLoaded = true
  }

  private findDefaultFlow(): any {
    return this.flows.find(f => f.name === DEFAULT_FLOW_NAME)
  }

  private findEntryNode(flow): any {
    return flow.nodes.find(n => n.name === ENTRY_NODE_NAME)
  }
}
