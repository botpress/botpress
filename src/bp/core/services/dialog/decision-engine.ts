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
      const bestMatch = this._findBestMath(event)
      if (bestMatch) {
        await this._sendSuggestedReply(bestMatch, sessionId, event)
      }
    }

    if (!event.hasFlag(WellKnownFlags.SKIP_DIALOG_ENGINE)) {
      const processedEvent = await this.dialogEngine.processEvent(sessionId, event)
      await this.stateManager.persist(processedEvent, false)
    }
  }

  // If the user asks the same question, chances are he didnt get the response he wanted.
  // So we cycle through the other suggested replies.
  protected _findBestMath(event: IO.IncomingEvent) {
    const replies = _.sortBy(event.suggestedReplies, reply => -reply.confidence)
    const lastMsg = _.last(event.state.session.lastMessages)
    const bestMatch = _.first(replies)

    // Return the first match if theres no previous messages
    if (!lastMsg && bestMatch && bestMatch.confidence > this.minConfidence) {
      console.log('First match', bestMatch)
      return bestMatch
    }

    // When the previous message intent matches the intent of a reply
    // Return the next best reply
    for (let i = 0; i < replies.length; i++) {
      const replyIntent = replies[i].intent
      const lastMsgIntent = lastMsg && lastMsg.intent
      const lastMsgPreview = lastMsg && lastMsg.user

      const isSameIntent = replyIntent === lastMsgIntent
      const isSameText = lastMsgPreview === event.payload.text

      if (isSameIntent || isSameText) {
        const bestMatch = replies[i + 1]

        if (bestMatch && bestMatch.confidence > this.minConfidence) {
          console.log('Second match', bestMatch)
          return bestMatch
        }
      }
    }
  }

  private async _sendSuggestedReply(reply, sessionId, event) {
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
