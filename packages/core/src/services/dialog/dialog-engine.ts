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
export class DialogEngine {
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
    this.transitionToNext()
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
    const conditions = this.createTransitConditions(context)

    this.instructionQueue.push(...onEnter)

    if (!_.isEmpty(onReceive)) {
      this.pushWait()
    }

    this.instructionQueue.push(...onReceive, ...conditions)
  }

  private pushWait() {
    const wait: Instruction = { type: 'wait' }
    this.instructionQueue.push(wait)
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
    const instructions = <Array<any>>context.currentNode && context.currentNode.onReceive
    if (!instructions) {
      return []
    }

    // TODO: Test that node relative onReceive are added
    // Execute onReceives relative to the flow before the ones relative to the node
    const flowReceive = context.currentFlow.catchAll && context.currentFlow.catchAll.onReceive
    if (!_.isEmpty(flowReceive)) {
      instructions.push(flowReceive)
    }

    return instructions.map(x => {
      return { type: 'on-receive', fn: x }
    })
  }

  private createTransitConditions(context): Instruction[] {
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

      // Stop processing instructions and wait for next message
      if (instruction.type === 'wait') {
        break
      }

      const result = await this.instructionProcessor.process(
        instruction,
        this.currentSession.state,
        this.currentSession.event,
        this.currentSession.context
      )

      if (!result) {
        this.failedAttempts++
        if (this.hasTooManyAttempts()) {
          throw new Error('Too many instructions failed')
        } else {
          this.pushWait()
          this.instructionQueue.push(instruction)
        }
      }

      this.resetFailedAttempts()
    }
  }

  private transitionToNext(): any {
    const context = JSON.parse(this.currentSession.context)

    if (!context.currentNode) {
      // No context
      return
    }

    console.log(context)
    const nextNode = context.currentNode.next.node
    const nextFlow = context.currentNode.next.flow
    console.log(nextNode, nextFlow)

    this.instructionQueue = []

    // Find node or entry node of flow
    let next
    if (nextNode) {
      next = this.currentSession.context.currentFlow.nodes.find(n => n.name === nextNode)
    } else if (nextFlow) {
      next = this.flows.find(f => f.name)
    }

    console.log('NEXT', next)

    // Update context
    // Done.
  }

  private resetFailedAttempts() {
    this.failedAttempts = 0
  }

  private hasTooManyAttempts() {
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
