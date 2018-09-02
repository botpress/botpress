import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../../misc/types'
import { DialogSession } from '../../repositories/session-repository'

import FlowService from './flow-service'
import { InstructionProcessor } from './instruction-processor'
import { InstructionQueue } from './instruction-queue'
import { SessionService } from './session-service'

// TODO: Allow multi-bot
const BOT_ID = 'bot123'
const DEFAULT_FLOW_NAME = 'main.flow.json'
const MAX_FAILED_ATTEMPS = 10

@injectable()
export class DialogEngine {
  queue = new InstructionQueue()
  flows: any[] = []
  flowsLoaded = false
  currentSession!: DialogSession
  failedAttempts = 0

  constructor(
    @inject(TYPES.InstructionProcessor) private instructionProcessor: InstructionProcessor,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.SessionService) private sessionService: SessionService
  ) {}

  /**
   * The main entry point to the Dialog Engine....
   * @param sessionId The ID that will identify the session. Generally the user ID
   * @param event The incoming botpress event
   */
  async processEvent(sessionId, event) {
    if (!this.flowsLoaded) {
      await this.reloadFlows()
    }

    const defaultFlow = this.findDefaultFlow()
    const entryNode = this.findEntryNode(defaultFlow)
    this.currentSession = await this.sessionService.getOrCreateSession(sessionId, event, defaultFlow, entryNode)
    this.queue.enqueueContextInstructions(this.currentSession.context)

    await this.processInstructions()
  }

  async processInstructions() {
    while (this.queue.hasInstructions()) {
      const instruction = this.queue.dequeue()!

      if (instruction.type === 'wait') {
        break
      }

      const result = await this.instructionProcessor.process(
        instruction,
        this.currentSession.state,
        this.currentSession.event,
        this.currentSession.context
      )

      if (result && instruction.type === 'transition' && instruction.node) {
        this.transitionToNode(instruction.node)
        break
      }

      if (!result) {
        this.failedAttempts++
        if (this.hasTooManyAttempts()) {
          throw new Error('Too many instructions failed')
        }

        this.queue.retry(instruction)
      } else {
        this.failedAttempts = 0
      }
    }
  }

  async transitionToNode(next: string): Promise<void> {
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

    this.queue.clear()
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
