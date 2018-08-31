import { inject, injectable, named } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../../misc/types'
import { DialogSession } from '../../repositories/session-repository'

import FlowService from './flow-service'
import { InstructionFactory } from './instruction-factory'
import { Instruction, InstructionProcessor } from './instruction-processor'
import { SessionService } from './session-service'

// TODO: Allow multi-bot
const BOT_ID = 'bot123'
const DEFAULT_FLOW_NAME = 'main.flow.json'
const MAX_FAILED_ATTEMPS = 10

@injectable()
export class DialogEngine {
  instructions: Instruction[] = []
  flows: any[] = []
  flowsLoaded = false
  currentSession!: DialogSession
  failedAttempts = 0

  constructor(
    @inject(TYPES.InstructionFactory) private queue: InstructionFactory,
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.SessionService) private sessionService: SessionService
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
    const context = JSON.parse(this.currentSession.context)
    this.instructions = this.queue.enqueueInstructions(context)

    await this.processInstructions()
  }

  async getOrCreateSession(sessionId, event): Promise<DialogSession> {
    const session = await this.sessionService.getSession(sessionId)
    if (!session) {
      const defaultFlow = this.findDefaultFlow()
      const entryNode = this.findEntryNode(defaultFlow)

      return this.sessionService.createSession(sessionId, defaultFlow, entryNode, event)
    }
    return session
  }

  async processInstructions() {
    while (this.instructions.length > 0) {
      const instruction = this.instructions.pop()!

      if (instruction.type === 'wait') {
        // Stop processing instructions and wait for next message
        break
      }

      const result = await this.instructionProcessor.process(
        instruction,
        this.currentSession.state,
        this.currentSession.event,
        this.currentSession.context
      )

      if (result && instruction.type === 'transition-condition') {
        this.transitionToNextNode(instruction.node)
        break
      }

      if (!result) {
        this.failedAttempts++

        if (this.hasTooManyAttempts()) {
          throw new Error('Too many instructions failed')
        }

        const wait = this.queue.createWait()

        this.instructions.unshift(wait)
        this.instructions.unshift(instruction)
      } else {
        this.failedAttempts = 0
      }
    }
  }

  async transitionToNextNode(next: string): Promise<void> {
    const context = this.currentSession.context
    let newContext = { ...context, previousNode: context.currentNode, previousFlow: context.currentFlow }
    let node: any
    let flow: any

    if (next.indexOf('##') > -1) {
      node = context.previousNode
      flow = context.previousFlow
    } else if (next.indexOf('#') > -1) {
      const nodeName = next.slice(1)
      node = context.previousFlow.nodes.find(n => n.name === nodeName)
      flow = context.previousFlow
    } else {
      node = context.currentFlow.nodes.find(x => x.name === next)
    }

    if (!node) {
      flow = this.flows.find(x => x.name === next)
      if (!flow) {
        throw new Error(`Could not find any node or flow under the name of "${next}"`)
      }
      node = this.findEntryNode(flow)
    }

    newContext = { ...newContext, currentNode: node }
    if (flow) {
      newContext = { ...newContext, currentFlow: flow }
    }

    this.instructions = []
    this.currentSession.context = newContext

    await this.sessionService.updateSession(this.currentSession)
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
    return flow.nodes.find(n => n.name === flow.startNode)
  }
}
