import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { conditionsDefinitions } from './conditions'
import { TriggerGoal } from './typings'

const debug = DEBUG('ndu').sub('processing')

export class UnderstandingEngine {
  private bp: typeof sdk
  private _allTriggers: Map<string, TriggerGoal[]> = new Map()

  private readonly MIN_CONFIDENCE = process.env.BP_DECISION_MIN_CONFIENCE || 0.5
  private readonly MIN_NO_REPEAT = ms(process.env.BP_DECISION_MIN_NO_REPEAT || '20s')

  constructor(bp: typeof sdk) {
    this.bp = bp
  }

  preprocessEvent(event: sdk.IO.IncomingEvent) {
    const activeGoal = _.get(
      event.state.session.lastGoals.find(x => x.active),
      'goal'
    )
    const activeContexts = (event.state.session.nluContexts || []).filter(x => x.context !== 'global')
    const isInMiddleOfFlow = _.get(event, 'state.context.currentFlow', false)

    this._amendSuggestionsWithDecision(event.suggestions!, _.get(event, 'state.session.lastMessages', []))
    const electedSuggestion = event.suggestions!.find(x => x.decision && x.decision.status === 'elected')

    return {
      activeGoal,
      activeContexts,
      isInMiddleOfFlow,
      electedSuggestion,
      completedTriggers: this._getGoalsWithCompletedTriggers(event)
    }
  }

  async processEvent(event: sdk.IO.IncomingEvent) {
    Object.assign(event, {
      ndu: {
        triggers: [],
        actions: []
      }
    })

    await this._processTriggers(event)

    const { activeGoal, activeContexts, isInMiddleOfFlow, electedSuggestion, completedTriggers } = this.preprocessEvent(
      event
    )

    debug('Processing %o', { activeGoal, activeContexts, isInMiddleOfFlow, electedSuggestion })

    const actions = []

    // No active goal or contexts. Enable the highest one
    if (!(activeGoal && isInMiddleOfFlow) && !activeContexts.length && event.nlu.ctxPreds) {
      const { label, confidence } = event.nlu.ctxPreds[0]
      if (confidence > 0.5) {
        event.state.session.nluContexts = [...(event.state.session.nluContexts || []), { context: label, ttl: 3 }]
        debug(`No active goal or context. Activate topic with highest confidence: ${label} `)
      } else {
        debug(`No active goal or context. Top context prediction too low `)
      }
    }

    if (electedSuggestion) {
      // QNA are always active
      const payloads = _.filter(electedSuggestion.payloads, p => p.type !== 'redirect')
      if (payloads) {
        actions.push({ action: 'send', data: electedSuggestion })
      }

      // Ignore redirections when in middle of flow
      if (!isInMiddleOfFlow) {
        const redirect = _.find(electedSuggestion.payloads, p => p.type === 'redirect')
        if (redirect && redirect.flow && redirect.node) {
          actions.push({ action: 'redirect', data: redirect })
          actions.push({ action: 'continue' })
        }
      }
    }

    // When not actively in a flow and a trigger is active, redirect the user
    if (completedTriggers.length && !isInMiddleOfFlow) {
      debug(`Not currently in a flow, redirecting to goal %o `, completedTriggers[0])
      const [topic] = completedTriggers[0].split('/')
      event.state.session.nluContexts = [
        { context: 'global', ttl: 2 },
        { context: topic, ttl: 2 }
      ]
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
        result[condition.id] = executer.evaluate(event, condition.params)
      } else {
        console.error(`Unknown condition "${condition.id}"`)
      }
      return result
    }, {})
  }

  protected _amendSuggestionsWithDecision(suggestions: sdk.IO.Suggestion[], turnsHistory: sdk.IO.DialogTurnHistory[]) {
    const replies = _.orderBy(suggestions, ['confidence'], ['desc'])

    let bestReply: sdk.IO.Suggestion | undefined = undefined

    for (let i = 0; i < replies.length; i++) {
      if (replies[i].confidence < this.MIN_CONFIDENCE) {
        replies[i].decision = { status: 'dropped', reason: `confidence lower than ${this.MIN_CONFIDENCE}` }
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
