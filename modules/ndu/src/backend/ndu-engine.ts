import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { conditionsDefinitions } from './conditions'
import { TriggerGoal } from './typings'

export class UnderstandingEngine {
  private bp: typeof sdk
  private _allTriggers: Map<string, TriggerGoal[]> = new Map()

  private readonly MIN_CONFIDENCE = process.env.BP_DECISION_MIN_CONFIENCE || 0.5
  private readonly MIN_NO_REPEAT = ms(process.env.BP_DECISION_MIN_NO_REPEAT || '20s')

  constructor(bp: typeof sdk) {
    this.bp = bp
  }

  async processEvent(event: sdk.IO.IncomingEvent) {
    Object.assign(event, {
      ndu: {
        triggers: [],
        actions: []
      }
    })

    this._amendSuggestionsWithDecision(event.suggestions!, _.get(event, 'state.session.lastMessages', []))

    const isInMiddleOfFlow = _.get(event, 'state.context.currentFlow', false)
    // if (isInMiddleOfFlow) {
    //   event.suggestions!.forEach(suggestion => {
    //     if (suggestion.decision.status === 'elected') {
    //       suggestion.decision.status = 'dropped'
    //       suggestion.decision.reason = 'would have been elected, but already in the middle of a flow'
    //     }
    //   })
    // }

    await this._processTriggers(event)

    const elected = event.suggestions!.find(x => x.decision.status === 'elected')
    const actions = []

    if (elected) {
      // QNA are always active
      const payloads = _.filter(elected.payloads, p => p.type !== 'redirect')
      if (payloads) {
        actions.push({ action: 'send', data: elected })
      }

      // Ignore redirections when in middle of flow
      if (!isInMiddleOfFlow) {
        const redirect = _.find(elected.payloads, p => p.type === 'redirect')
        if (redirect && redirect.flow && redirect.node) {
          actions.push({ action: 'redirect', data: redirect })
          actions.push({ action: 'continue' })
        }
      }
    }

    // When not actively in a flow and a trigger is active, redirect the user
    const completedTriggers = this._getGoalsWithCompletedTriggers(event)
    if (completedTriggers.length && !isInMiddleOfFlow) {
      const [topic] = completedTriggers[0].split('/')
      event.state.session.nluContexts = [{ context: 'global', ttl: 5 }, { context: topic, ttl: 5 }]
      actions.push({ action: 'redirect', data: { flow: completedTriggers[0] } })
      actions.push({ action: 'continue' })
    }

    // Nothing will be done, continue with the normal flow
    if (!actions.length) {
      actions.push({ action: 'continue' })
    }

    event.ndu.actions = actions
  }

  private _getGoalsWithCompletedTriggers(event: sdk.IO.IncomingEvent) {
    return Object.keys(event.ndu.triggers)
      .map(triggerId => {
        const { result, goal } = event.ndu.triggers[triggerId]
        return !_.isEmpty(result) && _.every(_.values(result), x => x > 0.5) && goal
      })
      .filter(Boolean)
  }

  async _processTriggers(event: sdk.IO.IncomingEvent) {
    if (!this._allTriggers.has(event.botId)) {
      await this._loadBotGoals(event.botId)
    }

    event.ndu.triggers = this._allTriggers.get(event.botId).reduce((result, trigger) => {
      result[trigger.id] = { goal: trigger.goal, result: this._testConditions(event, trigger.conditions) }
      return result
    }, {})
  }

  private _testConditions(event: sdk.IO.IncomingEvent, conditions: sdk.FlowCondition[]) {
    return conditions.reduce((result, condition) => {
      const executer = conditionsDefinitions.find(x => x.id === condition.id)
      if (executer) {
        result[condition.id] = executer.evaluate(condition.params, event)
      } else {
        console.error(`Unknown condition "${condition.id}"`)
      }
      return result
    }, {})
  }

  protected _amendSuggestionsWithDecision(suggestions: sdk.IO.Suggestion[], turnsHistory: sdk.IO.DialogTurnHistory[]) {
    // TODO Write unit tests
    // TODO The ML-based decision unit will be inserted here
    const replies = _.orderBy(suggestions, ['confidence'], ['desc'])
    const lastMsg = _.last(turnsHistory)
    const lastMessageSource = lastMsg && lastMsg.replySource

    let bestReply: sdk.IO.Suggestion | undefined = undefined

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
        // replies[i].decision = { status: 'dropped', reason: `bot would repeat itself (within ${this.MIN_NO_REPEAT}ms)` }
      } else if (bestReply) {
        replies[i].decision = { status: 'dropped', reason: 'best suggestion already elected' }
      } else {
        bestReply = replies[i]
        replies[i].decision = { status: 'elected', reason: 'best remaining suggestion available' }
      }
    }
  }

  async invalidateGoals(botId: string) {
    this._allTriggers.delete(botId)
  }

  private async _loadBotGoals(botId: string) {
    const flowsPaths = await this.bp.ghost.forBot(botId).directoryListing('flows', '*.flow.json')
    const flows: any[] = await Promise.map(flowsPaths, async (flowPath: string) => {
      return { name: flowPath, ...(await this.bp.ghost.forBot(botId).readFileAsObject('flows', flowPath)) }
    })

    const triggers = _.flatMap(flows, x => (x.triggers || []).map(tr => ({ ...tr, goal: x.name }))) as TriggerGoal[]

    this._allTriggers.set(botId, triggers)
  }
}
