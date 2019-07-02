import { IO, Logger } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { WellKnownFlags } from 'core/sdk/enums'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { CMSService } from '../cms'
import { EventEngine } from '../middleware/event-engine'
import { StateManager } from '../middleware/state-manager'

import { DialogEngine } from './dialog-engine'

type SendSuggestionResult = { executeFlows: boolean }

@injectable()
export class DecisionEngine {
  public onBeforeSuggestionsElection:
    | ((sessionId: string, event: IO.IncomingEvent, suggestions: IO.Suggestion[]) => Promise<void>)
    | undefined
  public onAfterEventProcessed: ((event) => Promise<void>) | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'DialogEngine')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.StateManager) private stateManager: StateManager,
    @inject(TYPES.CMSService) private cms: CMSService
  ) {}

  private readonly MIN_CONFIDENCE = process.env.BP_DECISION_MIN_CONFIENCE || 0.5
  private readonly MIN_NO_REPEAT = ms(process.env.BP_DECISION_MIN_NO_REPEAT || '20s')

  public async processEvent(sessionId: string, event: IO.IncomingEvent) {
    const isInMiddleOfFlow = _.get(event, 'state.context.currentFlow', false)
    if (!event.suggestions) {
      Object.assign(event, { suggestions: [] })
    }

    this._amendSuggestionsWithDecision(event.suggestions!, _.get(event, 'state.session.lastMessages', []))

    if (isInMiddleOfFlow) {
      event.suggestions!.forEach(suggestion => {
        if (suggestion.decision.status === 'elected') {
          suggestion.decision.status = 'dropped'
          suggestion.decision.reason = 'would have been elected, but already in the middle of a flow'
        }
      })
    }

    if (this.onBeforeSuggestionsElection) {
      await this.onBeforeSuggestionsElection(sessionId, event, event.suggestions!)
    }

    const elected = event.suggestions!.find(x => x.decision.status === 'elected')
    let sendSuggestionResult: SendSuggestionResult | undefined

    if (elected) {
      Object.assign(event, { decision: elected })
      sendSuggestionResult = await this._sendSuggestion(elected, sessionId, event)
    }

    if (
      !event.hasFlag(WellKnownFlags.SKIP_DIALOG_ENGINE) &&
      (!sendSuggestionResult || sendSuggestionResult!.executeFlows)
    ) {
      try {
        Object.assign(event, {
          decision: <IO.Suggestion>{
            decision: { reason: 'no suggestion matched', status: 'elected' },
            confidence: 1,
            payloads: [],
            source: 'decisionEngine',
            sourceDetails: 'execute default flow'
          }
        })
        const processedEvent = await this.dialogEngine.processEvent(sessionId, event)
        this.onAfterEventProcessed && (await this.onAfterEventProcessed(processedEvent))

        await this.stateManager.persist(processedEvent, false)
        return
      } catch (err) {
        this.logger
          .forBot(event.botId)
          .attachError(err)
          .error('An unexpected error occurred.')
        await this._sendErrorMessage(event)
      }
    }

    if (event.hasFlag(WellKnownFlags.FORCE_PERSIST_STATE)) {
      await this.stateManager.persist(event, false)
    }
  }

  protected _amendSuggestionsWithDecision(suggestions: IO.Suggestion[], turnsHistory: IO.DialogTurnHistory[]) {
    // TODO Write unit tests
    // TODO The ML-based decision unit will be inserted here
    const replies = _.orderBy(suggestions, ['confidence'], ['desc'])
    const lastMsg = _.last(turnsHistory)
    const lastMessageSource = lastMsg && lastMsg.replySource

    let bestReply: IO.Suggestion | undefined = undefined

    for (let i = 0; i < replies.length; i++) {
      const replySource = replies[i].source + ' ' + replies[i].sourceDetails || Date.now()

      const violatesRepeatPolicy =
        replySource === lastMessageSource &&
        moment(lastMsg!.replyDate)
          .add(this.MIN_NO_REPEAT, 'ms')
          .isAfter(moment())

      if (replies[i].confidence < this.MIN_CONFIDENCE) {
        replies[i].decision = { status: 'dropped', reason: `confidence lower than ${this.MIN_CONFIDENCE}` }
      } else if (violatesRepeatPolicy) {
        replies[i].decision = { status: 'dropped', reason: `bot would repeat itself (within ${this.MIN_NO_REPEAT}ms)` }
      } else if (bestReply) {
        replies[i].decision = { status: 'dropped', reason: 'best suggestion already elected' }
      } else {
        bestReply = replies[i]
        replies[i].decision = { status: 'elected', reason: 'best remaining suggestion available' }
      }
    }
  }

  private async _sendSuggestion(
    reply: IO.Suggestion,
    sessionId,
    event: IO.IncomingEvent
  ): Promise<SendSuggestionResult> {
    const payloads = _.filter(reply.payloads, p => p.type !== 'redirect')
    const result: SendSuggestionResult = { executeFlows: true }

    if (payloads) {
      await this.eventEngine.replyToEvent(event, payloads, event.id)

      const message: IO.DialogTurnHistory = {
        eventId: event.id,
        replyDate: new Date(),
        replySource: reply.source + ' ' + reply.sourceDetails,
        incomingPreview: event.preview,
        replyConfidence: reply.confidence,
        replyPreview: _.find(payloads, p => p.text !== undefined)
      }

      result.executeFlows = false
      event.state.session.lastMessages.push(message)

      await this.stateManager.persist(event, true)
    }

    const redirect = _.find(reply.payloads, p => p.type === 'redirect')
    if (redirect && redirect.flow && redirect.node) {
      await this.dialogEngine.jumpTo(sessionId, event, redirect.flow, redirect.node)
      result.executeFlows = true
    }

    if (!result.executeFlows) {
      this.onAfterEventProcessed && (await this.onAfterEventProcessed(event))
    }

    return result
  }

  private async _sendErrorMessage(event: IO.Event) {
    const config = await this.configProvider.getBotConfig(event.botId)
    const element = _.get(config, 'dialog.error.args', {
      text: "😯 Oops! We've got a problem. Please try something else while we're fixing it 🔨",
      typing: true
    })
    const contentType = _.get(config, 'dialog.error.contentType', 'builtin_text')
    const eventDestination = _.pick(event, ['channel', 'target', 'botId', 'threadId'])
    const payloads = await this.cms.renderElement(contentType, element, eventDestination)

    await this.eventEngine.replyToEvent(event, payloads, event.id)
  }
}
