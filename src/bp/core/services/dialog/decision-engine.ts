import { IO, Logger } from 'botpress/sdk'
import { WellKnownFlags } from 'core/sdk/enums'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { EventEngine } from '../middleware/event-engine'
import { StateManager } from '../middleware/state-manager'

import { DialogEngine } from './engine'

@injectable()
export class DecisionEngine {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.StateManager) private stateManager: StateManager
  ) {}

  private minConfidence = 0.3

  public async processEvent(sessionId: string, event: IO.IncomingEvent) {
    if (event.suggestedReplies) {
      const bestMatch = _.first(_.sortBy(event.suggestedReplies, reply => -reply.confidence))

      if (bestMatch && bestMatch.confidence > this.minConfidence) {
        await this.sendSuggestedReply(bestMatch, sessionId, event)
      }
    }

    if (!event.hasFlag(WellKnownFlags.SKIP_DIALOG_ENGINE)) {
      const processedEvent = await this.dialogEngine.processEvent(sessionId, event)
      await this.stateManager.persist(processedEvent, false)
    }
  }

  private async sendSuggestedReply(reply, sessionId, event) {
    const payloads = _.filter(reply.payloads, p => p.type !== 'redirect')
    if (payloads) {
      await this.eventEngine.replyToEvent(event, payloads)

      const message: IO.MessageHistory = {
        intent: reply.intent,
        user: event.preview,
        reply: _.find(payloads, p => p.text != undefined)
      }
      event.state.session.lastMessages.push(message)

      await this.stateManager.persist(event, true)
    }

    const redirect = _.find(reply.payloads, p => p.type === 'redirect')
    if (redirect && redirect.flow && redirect.node) {
      await this.dialogEngine.jumpTo(sessionId, event, redirect.flow, redirect.node)
    } else {
      event.setFlag(WellKnownFlags.SKIP_DIALOG_ENGINE, true)
    }
  }
}
