import axios from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { conditionsDefinitions } from './conditions'
import Database, { nbRankingIntent } from './db'
import { TriggerGoal } from './typings'

const debug = DEBUG('ndu').sub('processing')

export class UnderstandingEngine {
  private _allTriggers: Map<string, TriggerGoal[]> = new Map()
  private readonly MIN_CONFIDENCE = process.env.BP_DECISION_MIN_CONFIENCE || 0.5

  constructor(private bp: typeof sdk, private db: Database) {}

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
    const currentFlow = _.get(
      event.state.session.lastGoals.find(x => x.active),
      'goal'
    )
    const currentTopic = currentFlow?.split('/')[0]
    const currentGoal = currentFlow?.replace(currentTopic, '').substr(1)
    const activeContexts = (event.state.session.nluContexts || []).filter(x => x.context !== 'global')
    const isInMiddleOfFlow = _.get(event, 'state.context.currentFlow', false)

    return {
      currentTopic,
      currentGoal,
      currentFlow,
      activeContexts,
      isInMiddleOfFlow
    }
  }

  getPredictionScores(predictions: sdk.IO.Predictions) {
    const results = _.flatMap(predictions, ({ confidence, intents }, key) =>
      intents.map(intent => ({
        topicName: key,
        topicConfidence: confidence,
        topicIntentName: intent.label,
        topicIntentConfidence: intent.confidence,
        topicIntentConfidenceAdjusted: confidence * intent.confidence,
        topicIntentType: intent.label.startsWith('__qna__') ? 'QNA' : 'NLU'
      }))
    )

    return _.orderBy(results, 'topicIntentConfidenceAdj', 'desc')
  }

  async processEvent(event: sdk.IO.IncomingEvent) {
    Object.assign(event, {
      ndu: {
        triggers: [],
        actions: []
      }
    })

    const { currentTopic, currentGoal, currentFlow, activeContexts, isInMiddleOfFlow } = this.preprocessEvent(event)

    debug('Processing %o', { currentFlow, activeContexts, isInMiddleOfFlow })

    const actions = []

    // Need some magic to get the best topic (maybe it's the second one with better scoring intents? )
    const bestTopic = _.findKey(event.nlu.predictions, x => x.confidence > this.MIN_CONFIDENCE)

    // No active goal or contexts, so we'll add the top as context
    if (!(currentFlow && isInMiddleOfFlow) && !activeContexts.length && event.nlu.predictions) {
      if (bestTopic) {
        event.state.session.nluContexts = [...(event.state.session.nluContexts || []), { context: bestTopic, ttl: 3 }]
        debug(`No active goal or context. Activate topic with highest confidence: ${bestTopic} `)
      } else {
        debug(`No active goal or context. Top context prediction too low `)
      }
    }

    const predictionScores = this.getPredictionScores(event.nlu.predictions)

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

    await this.db.insertData({
      incomingEventId: event.id,
      currentTopicName: currentTopic,
      currentTopicGoal: currentGoal,
      currentTopicLastActionName: undefined,
      currentTopicLastActionSince: undefined,
      nduDecisionActions: event.ndu.actions,
      nduDecisionConfidence: event.nlu.intent?.confidence,
      ..._.take(predictionScores, nbRankingIntent).reduce((acc, pred, idx) => {
        return {
          ...acc,
          ..._.mapKeys(pred, (_val, key) => `ranking${idx + 1}${key}`)
        }
      }, {})
    })
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

  async invalidateGoals(botId: string) {
    this._allTriggers.delete(botId)
  }

  private async _loadBotGoals(botId: string) {
    const flowsPaths = await this.bp.ghost.forBot(botId).directoryListing('flows', '*.flow.json')
    const flows: any[] = await Promise.map(flowsPaths, async (flowPath: string) => {
      return { name: flowPath, ...((await this.bp.ghost.forBot(botId).readFileAsObject('flows', flowPath)) as any) }
    })

    const triggers = _.flatMap(flows, x => (x.triggers || []).map(tr => ({ ...tr, goal: x.name }))) as TriggerGoal[]

    this._allTriggers.set(botId, triggers)
  }
}
