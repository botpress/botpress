import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../../misc/types'
import { DialogSession } from '../../repositories/session-repository'
import ActionService from '../action/action-service'

import { CallProcessor } from './call-processor'
import FlowService from './flow-service'
import { SessionService } from './session-service'

// TODO: Allow multi-bot
const BOT_ID = 'bot123'
const DEFAULT_FLOW_NAME = 'main.flow.json'
const ENTRY_NODE_NAME = 'entry'

@injectable()
export class NewDialogEngine {
  private callQueue: any[] = []
  private flows: any[] = []

  private flowsLoaded = false
  private currentSession: DialogSession | undefined
  private currentFlow: any
  private currentNode: any

  constructor(
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.CallProcessor) private callProcessor: CallProcessor,
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
    this.fillQueue()
    this.executeQueue()
  }

  private fillQueue() {
    const context = JSON.parse(this.currentSession!.context)
    const onEnter = _.flatten(context.currentNode.onEnter)
    const onReceive = _.flatten(context.currentNode.onReceive)
    this.callQueue.push(onEnter, onReceive)

    this.callQueue = _.flatten(this.callQueue)
  }

  private executeQueue(): any {
    this.callQueue.reverse() // To act as a queue

    const call = this.callQueue.pop()
    this.callProcessor.processCall(call, {}, {}, {})
    // Update session
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
