import axios from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { conditionsDefinitions } from './conditions'
import { TriggerGoal } from './typings'

const debug = DEBUG('ndu').sub('processing')

export class UnderstandingEngine {
  private bp: typeof sdk
  private _allTriggers: Map<string, TriggerGoal[]> = new Map()

  private readonly MIN_CONFIDENCE = process.env.BP_DECISION_MIN_CONFIENCE || 0.5

  constructor(bp: typeof sdk) {
    this.bp = bp
  }

  queryQna = async (intentName: string, event): Promise<sdk.NDU.Actions[]> => {
    try {
      const axiosConfig = await this.bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
      const { data } = await axios.post('/mod/qna/intentActions', { intentName, event }, axiosConfig)
      return data as sdk.NDU.Actions[]
    } catch (err) {
      this.bp.logger.warn('Could not query qna', err)
      return []
    }
  }

  preprocessEvent(event: sdk.IO.IncomingEvent) {
    const activeGoal = _.get(
      event.state.session.lastGoals.find(x => x.active),
      'goal'
    )
    const activeContexts = (event.state.session.nluContexts || []).filter(x => x.context !== 'global')
    const isInMiddleOfFlow = _.get(event, 'state.context.currentFlow', false)

    return {
      activeGoal,
      activeContexts,
      isInMiddleOfFlow
    }
  }

  async processEvent(event: sdk.IO.IncomingEvent) {
    Object.assign(event, {
      ndu: {
        triggers: [],
        actions: []
      }
    })

    const { activeGoal, activeContexts, isInMiddleOfFlow } = this.preprocessEvent(event)

    debug('Processing %o', { activeGoal, activeContexts, isInMiddleOfFlow })

    const actions = []

    // Need some magic to get the best topic (maybe it's the second one with better scoring intents? )
    const bestTopic = _.findKey(event.nlu.predictions, x => x.confidence > this.MIN_CONFIDENCE)

    // No active goal or contexts, so we'll add the top as context
    if (!(activeGoal && isInMiddleOfFlow) && !activeContexts.length && event.nlu.predictions) {
      if (bestTopic) {
        event.state.session.nluContexts = [...(event.state.session.nluContexts || []), { context: bestTopic, ttl: 3 }]
        debug(`No active goal or context. Activate topic with highest confidence: ${bestTopic} `)
      } else {
        debug(`No active goal or context. Top context prediction too low `)
      }
    }

    const bestIntents = event.nlu.predictions?.[bestTopic]?.intents?.map(x => ({
      name: x.label,
      confidence: x.confidence,
      context: bestTopic
    }))

    // Overwrite the NLU detected intents
    event.nlu.intent = bestIntents?.[0]
    event.nlu.intents = bestIntents

    // Then process triggers on what the NDU decided
    await this._processTriggers(event)

    const possibleGoals = this._getGoalsWithCompletedTriggers(event)
    possibleGoals.length && debug(`Possible goals: %o`, possibleGoals)

    // If it's a QNA, we query the module to get the actions to execute
    if (event.nlu.intent?.name?.startsWith('__qna__')) {
      debug(`Sending knowledge for %o`, event.nlu.intent)
      const qnaActions = await this.queryQna(event.nlu.intent.name, event)

      // if (isInMiddleOfFlow && qnaActions.find(x => x.action === 'redirect')) {
      //   qnaActions = qnaActions.filter(x => x.action === 'redirect')
      //   // actions.push({ action: 'continue' })
      // }

      actions.push(...qnaActions)
    }

    // When not actively in a flow and a trigger is active, redirect the user to a goal
    if (possibleGoals.length && !isInMiddleOfFlow) {
      // Need some magic to pick the best goal based on parameters
      const goal = possibleGoals[0]

      debug(`Not currently in a flow, redirecting to goal %o `, goal)
      const [topic] = goal.split('/')

      event.state.session.nluContexts = [
        { context: 'global', ttl: 2 },
        { context: topic, ttl: 2 }
      ]

      actions.push({ action: 'startGoal', data: { goal } })
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
