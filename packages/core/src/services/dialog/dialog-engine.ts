import { inject } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../../misc/types'
import { DialogSession } from '../../repositories/session-repository'

import FlowService from './flow-service'
import { SessionService } from './session-service'

// TODO: Allow multi-bot
const BOT_ID = 'bot123'
const DEFAULT_FLOW_NAME = 'main.flow.json'
const ENTRY_NODE_NAME = 'entry'

export class NewDialogEngine {
  private callstack: any[] = []
  private flows: any[] = []

  private flowsLoaded = false
  private currentSession: DialogSession | undefined

  constructor(
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
    this.callstack.push(this.currentSession.context.currentFlow.onEnter)
  }

  private async getOrCreateSession(sessionId, event) {
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
