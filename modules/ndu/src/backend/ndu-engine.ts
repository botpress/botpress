import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { FlowView } from 'common/typings'
import _ from 'lodash'

import { Config } from '../config'

import { BASE_DATA } from './base-data'
import MLToolkit from './ml/toolkit'
import { MLToolkit as IMLToolkit } from './ml/typings'
import { Features } from './typings'

const debug = DEBUG('ndu').sub('processing')

const ActionTypes = <const>[
  'faq_trigger_outside_topic',
  'faq_trigger_inside_topic',
  'wf_trigger_inside_topic',
  'wf_trigger_outside_topic',
  'wf_trigger_inside_wf',
  'faq_trigger_inside_wf',
  'node_trigger_inside_wf'
]

type ActionType = typeof ActionTypes[number]
type ActionPredictions = { [key in ActionType]: number }

const stringToVec = (choices: string[], value: string) => {
  const arr = Array(choices.length).fill(0)
  const idx = choices.indexOf(value)
  if (idx >= 0) {
    arr[idx] = 1
  }
  return arr
}

const newFeature = (): Features => ({
  conf_faq_trigger_inside_topic: 0,
  conf_faq_trigger_outside_topic: 0,
  conf_faq_trigger_parameter: 0,
  conf_node_trigger_inside_wf: 0,
  conf_wf_trigger_inside_topic: 0,
  conf_wf_trigger_inside_wf: 0,
  conf_wf_trigger_outside_topic: 0,
  current_highest_ranking_trigger_id: '',
  current_node_id: '',
  current_workflow_id: '',
  last_turn_action_name: '',
  last_turn_same_highest_ranking_trigger_id: false,
  last_turn_same_node: false,
  last_turn_since: 0
})

const dataset: [Features, ActionType][] = BASE_DATA.map(([feat, label]) => [
  Object.assign(newFeature(), (feat as any) as Features),
  <ActionType>label
])

const WfIdToTopic = (wfId: string): string | undefined => {
  if (wfId === 'n/a' || wfId.startsWith('skills/')) {
    return
  }

  return wfId.split('/')[0]
}

export const DEFAULT_MIN_CONFIDENCE = 0.1

export class UnderstandingEngine {
  private _allTopicIds: Set<string> = new Set()
  private _allNodeIds: Set<string> = new Set()
  private _allWfIds: Set<string> = new Set()

  private _allTriggers: Map<string, sdk.NDU.Trigger[]> = new Map()
  private _minConfidence: number

  trainer: IMLToolkit.SVM.Trainer
  predictor: IMLToolkit.SVM.Predictor

  constructor(private bp: typeof sdk, private _dialogConditions: sdk.Condition[], config: Config) {
    this.trainer = new MLToolkit.SVM.Trainer()
    this._minConfidence = config.minimumConfidence ?? DEFAULT_MIN_CONFIDENCE
  }

  featToVec(features: Features): number[] {
    const triggerId = stringToVec(
      _.flatten([...this._allTriggers.values()].map(x => x.map(this.getTriggerId))),
      features.current_highest_ranking_trigger_id
    ) // TODO: Fix this for bot specific
    const nodeId = stringToVec([...this._allNodeIds], features.current_node_id)
    const wfId = stringToVec([...this._allWfIds], features.current_workflow_id)
    const actionName = stringToVec([...ActionTypes], features.last_turn_action_name)

    const other = [
      features.last_turn_same_highest_ranking_trigger_id,
      features.last_turn_same_node,
      features.last_turn_since,
      features.conf_faq_trigger_inside_topic,
      features.conf_faq_trigger_outside_topic,
      features.conf_faq_trigger_parameter,
      features.conf_node_trigger_inside_wf,
      features.conf_wf_trigger_inside_topic,
      features.conf_wf_trigger_inside_wf,
      features.conf_wf_trigger_outside_topic
    ].map(n => (n === false ? 0 : n === true ? 1 : n))

    return [...triggerId, ...nodeId, ...wfId, ...actionName, ...other]
  }

  queryQna = async (intentName: string, event): Promise<sdk.NDU.Actions[]> => {
    try {
      const axiosConfig = await this.bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
      const { data } = await axios.post('/qna/intentActions', { intentName, event }, axiosConfig)
      const redirect: sdk.NDU.Actions[] = data.filter(a => a.action !== 'redirect')
      // TODO: Warn that REDIRECTS should be migrated over to flow nodes triggers
      return redirect
    } catch (err) {
      this.bp.logger.warn('Could not query qna', err)
      return []
    }
  }

  async trainIfNot() {
    if (!this.predictor) {
      const data = dataset.map(([feat, label]) => ({ label, coordinates: this.featToVec(feat) }))
      const duplicatedArray = _.shuffle(_.flatten(_.times(10, () => data)))
      const model = await this.trainer.train(duplicatedArray)
      this.predictor = new MLToolkit.SVM.Predictor(model)
      await this.predictor.initialize()
    }
  }

  async processEvent(event: sdk.IO.IncomingEvent) {
    Object.assign(event, {
      ndu: {
        triggers: [],
        actions: []
      }
    })

    if (event.type !== 'text' && event.type !== 'quick_reply' && event.type !== 'workflow_ended') {
      return
    }

    const currentFlow = event.state?.context?.currentFlow ?? 'n/a'
    const currentTopic = event.state?.session?.nduContext?.last_topic ?? 'n/a'
    const currentNode = event.state?.context?.currentNode ?? 'n/a'
    const isInMiddleOfFlow = currentFlow !== 'n/a'

    debug('Processing %o', { currentFlow, currentNode, isInMiddleOfFlow })

    // // Overwrite the NLU detected intents
    // event.nlu.intent = bestIntents?.[0]
    // event.nlu.intents = bestIntents

    // Then process triggers on what the NDU decided
    await this._processTriggers(event)

    //////////////////////////
    // Possible outcomes
    //////////////////////////

    // [Outside of workflow]
    // - Answer with FAQ
    // - Start a workflow
    // - Misunderstood
    // [In middle of flow]
    // - Continue processing flow (node trigger)
    // - Conitnue processing flow (internal workflow trigger) [later]
    // - Answer with FAQ inside current topic
    // - Answer with FAQ outside current topic
    // - Start an other workflow inside the same topic
    // - Start an other workflow in other topic

    // Features
    // - time since last input
    // - number of turns in workflow
    // - number of turns on same node
    // - confidence of faq outside topic
    // - confidence of faq inside topic
    // - confidence of wf trigger inside topic
    // - confidence of wf trigger outside topic
    // - confidence of wf trigger inside workflow
    // - last action name
    // X highest ranking trigger
    // X last turn higest ranking trigger same

    // TODO: NDU Maybe introduce trigger boosts in some circumstances, eg. exact match on workflow node or button click

    /** This metadata is persisted to be able to compute the "over-time" features the next turn */
    const metadata: sdk.IO.NduContext = Object.assign(
      {
        last_turn_action_name: 'n/a',
        last_turn_highest_ranking_trigger_id: 'n/a',
        last_turn_node_id: 'n/a',
        last_turn_ts: Date.now(),
        last_topic: ''
      },
      event.state?.session?.nduContext ?? {}
    )

    // TODO: NDU compute & rank triggers

    const triggers = _.toPairs(event.ndu.triggers).map(([id, result]) => {
      const confidence = Object.values(result.result).reduce((prev, next) => prev * next, 1)
      return {
        id,
        confidence,
        trigger: result.trigger,
        topic: id.split('/')[1],
        wf: (result.trigger as sdk.NDU.NodeTrigger | sdk.NDU.WorkflowTrigger).workflowId,
        nodeId: (result.trigger as sdk.NDU.NodeTrigger).nodeId
      }
    })

    const fType = (type: sdk.NDU.Trigger['type']) => (t: typeof triggers) => t.filter(x => x.trigger.type === type)
    const fInTopic = (t: typeof triggers) =>
      t.filter(x => (x.topic === currentTopic && currentTopic !== 'n/a') || x.topic === 'skills')
    const fOutTopic = (t: typeof triggers) => t.filter(x => x.topic !== currentTopic || currentTopic === 'n/a')
    const fInWf = (t: typeof triggers) => t.filter(x => `${x.wf}.flow.json` === currentFlow)
    const fOnNode = (t: typeof triggers) => t.filter(x => x.nodeId === currentNode)
    const fMax = (t: typeof triggers) => _.maxBy(t, 'confidence') || { confidence: 0, id: 'n/a' }
    const fMinConf = (t: typeof triggers) => t.filter(x => x.confidence >= this._minConfidence)

    const actionFeatures = {
      conf_all: fMax(triggers),
      conf_faq_trigger_outside_topic: fMax(fOutTopic(fType('faq')(fMinConf(triggers)))),
      conf_faq_trigger_inside_topic: fMax(fInTopic(fType('faq')(fMinConf(triggers)))),
      conf_faq_trigger_parameter: 0, // TODO: doesn't exist yet
      conf_wf_trigger_inside_topic: fMax(fInTopic(fType('workflow')(fMinConf(triggers)))),
      conf_wf_trigger_outside_topic: fMax(fOutTopic(fType('workflow')(fMinConf(triggers)))),
      conf_wf_trigger_inside_wf: 0, // TODO: doesn't exist yet
      conf_node_trigger_inside_wf: fMax(fInTopic(fType('node')(fInWf(fOnNode(fMinConf(triggers))))))
    }

    const features: Features = {
      ///////////
      // These features allow fitting of exceptional behaviors in specific circumstances
      current_workflow_id: currentFlow,
      current_node_id: currentNode,
      current_highest_ranking_trigger_id: actionFeatures.conf_all.id,
      ///////////
      // Understanding features
      conf_faq_trigger_outside_topic: actionFeatures.conf_faq_trigger_outside_topic.confidence,
      conf_faq_trigger_inside_topic: actionFeatures.conf_faq_trigger_inside_topic.confidence,
      conf_faq_trigger_parameter: 0, // TODO: doesn't exist yet
      conf_wf_trigger_inside_topic: actionFeatures.conf_wf_trigger_inside_topic.confidence,
      conf_wf_trigger_outside_topic: actionFeatures.conf_wf_trigger_outside_topic.confidence,
      conf_wf_trigger_inside_wf: 0, // TODO: doesn't exist yet
      conf_node_trigger_inside_wf: actionFeatures.conf_node_trigger_inside_wf.confidence,
      ///////////
      // Over-time features
      last_turn_since: Date.now() - metadata.last_turn_ts,
      last_turn_same_node: isInMiddleOfFlow && metadata.last_turn_node_id === `${currentFlow}/${currentNode}`,
      last_turn_action_name: metadata.last_turn_action_name,
      last_turn_same_highest_ranking_trigger_id:
        metadata.last_turn_highest_ranking_trigger_id === actionFeatures.conf_all.id
    }

    const predict = async (input: Features): Promise<ActionPredictions> => {
      const vec = this.featToVec(input)
      const preds = await this.predictor.predict(vec)
      // TODO: NDU Put ML here
      // TODO: NDU Import a fine-tuned model for this bot for prediction
      return ActionTypes.reduce<ActionPredictions>((obj, curr) => {
        const pred = preds.find(x => x.label === curr)
        obj[curr] = pred?.confidence ?? 0
        return obj
      }, <any>{})
    }

    await this.trainIfNot()
    const prediction = await predict(features)
    const topAction = _.maxBy(_.toPairs(prediction), '1')[0]

    const actionToTrigger: { [key in ActionType]: string } = {
      faq_trigger_inside_topic: actionFeatures.conf_faq_trigger_inside_topic.id,
      faq_trigger_inside_wf: '',
      faq_trigger_outside_topic: actionFeatures.conf_faq_trigger_outside_topic.id,
      node_trigger_inside_wf: actionFeatures.conf_node_trigger_inside_wf.id,
      wf_trigger_inside_topic: actionFeatures.conf_wf_trigger_inside_topic.id,
      wf_trigger_inside_wf: '',
      wf_trigger_outside_topic: actionFeatures.conf_wf_trigger_outside_topic.id
    }

    event.ndu.predictions = ActionTypes.reduce((obj, action) => {
      obj[action] = {
        confidence: prediction[action],
        triggerId: actionToTrigger[action]
      }
      return obj
    }, {} as any)

    const electedTrigger = event.ndu.triggers[actionToTrigger[topAction]]

    if (electedTrigger) {
      const { trigger } = electedTrigger

      switch (trigger.type) {
        case 'workflow':
          const sameWorkflow = trigger.workflowId === currentFlow?.replace('.flow.json', '')
          const sameNode = trigger.nodeId === currentNode

          event.ndu.actions = [{ action: 'continue' }]

          if (sameWorkflow && !sameNode) {
            event.ndu.actions.unshift({
              action: 'goToNode',
              data: { flow: trigger.workflowId, node: trigger.nodeId }
            })
          } else if (!sameWorkflow && !sameNode) {
            event.ndu.actions.unshift({
              action: 'startWorkflow',
              data: { flow: trigger.workflowId, node: trigger.nodeId }
            })
          }

          break
        case 'faq':
          const qnaActions = await this.queryQna(trigger.faqId, event)
          event.ndu.actions = [...qnaActions]
          break
        case 'node':
          event.ndu.actions = [{ action: 'continue' }] // TODO: NDU
          break
      }
    } else {
      event.ndu.actions = []
    }

    event.state.session.nduContext = {
      last_turn_action_name: topAction,
      last_turn_highest_ranking_trigger_id: actionFeatures.conf_all.id,
      last_turn_node_id: isInMiddleOfFlow && `${currentFlow}/${currentNode}`,
      last_turn_ts: Date.now(),
      last_topic:
        electedTrigger?.trigger.type === 'workflow'
          ? WfIdToTopic(electedTrigger.trigger.workflowId) || currentTopic
          : currentTopic
    }

    // TODO: NDU what to do if no action elected
    // TODO: NDU what to do if confused action
  }

  async _processTriggers(event: sdk.IO.IncomingEvent) {
    if (!this._allTriggers.has(event.botId)) {
      await this._loadBotWorkflows(event.botId)
    }
    const triggers = this._allTriggers.get(event.botId)

    event.ndu.triggers = {}

    const { currentFlow, currentNode } = event.state.context

    for (const trigger of triggers) {
      if (
        trigger.type === 'node' &&
        (currentFlow !== `${trigger.workflowId}.flow.json` || currentNode !== trigger.nodeId)
      ) {
        continue
      }

      if (
        trigger.type === 'workflow' &&
        trigger.activeWorkflow &&
        event.state?.context.currentFlow !== `${trigger.workflowId}.flow.json`
      ) {
        continue
      }

      if (!trigger.conditions.length) {
        continue
      }

      const id = this.getTriggerId(trigger)
      const result = this._testConditions(event, trigger.conditions)
      event.ndu.triggers[id] = { result, trigger }
    }
  }

  private getTriggerId(trigger: sdk.NDU.Trigger) {
    return trigger.type === 'workflow'
      ? `wf/${trigger.workflowId}/${trigger.nodeId}`
      : trigger.type === 'faq'
      ? `faq/${trigger.topicName}/${trigger.faqId}`
      : trigger.type === 'node'
      ? `node/${trigger.workflowId}/${trigger.nodeId}`
      : 'invalid_trigger/' + _.random(10 ^ 9, false)
  }

  private _testConditions(event: sdk.IO.IncomingEvent, conditions: sdk.DecisionTriggerCondition[]) {
    return conditions.reduce((result, condition) => {
      const executer = this._dialogConditions.find(x => x.id === condition.id)
      if (executer) {
        try {
          result[condition.id] = executer.evaluate(event, condition.params)
        } catch (err) {
          this.bp.logger
            .forBot(event.botId)
            .attachError(err)
            .warn(`Error evaluating NDU condition ${condition.id}`)
          result[condition.id] = -1 // TODO: NDU where do we want to show evaluation errors ?
        }
      } else {
        console.error(`Unknown condition "${condition.id}"`)
      }
      return result
    }, {})
  }

  async invalidateWorkflows(botId: string) {
    this._allTriggers.delete(botId)
    this.predictor = undefined
  }

  private async _loadBotWorkflows(botId: string) {
    const flowsPaths = await this.bp.ghost.forBot(botId).directoryListing('flows', '*.flow.json')
    const flows: sdk.Flow[] = await Promise.map(flowsPaths, async (flowPath: string) => ({
      name: flowPath,
      ...(await this.bp.ghost.forBot(botId).readFileAsObject<FlowView>('flows', flowPath))
    }))

    const intentsPath = await this.bp.ghost.forBot(botId).directoryListing('intents', '*.json')
    const qnaPaths = intentsPath.filter(x => x.includes('__qna__')) // TODO: change this
    const faqs: sdk.NLU.IntentDefinition[] = await Promise.map(qnaPaths, (qnaPath: string) =>
      this.bp.ghost.forBot(botId).readFileAsObject<sdk.NLU.IntentDefinition>('intents', qnaPath)
    )

    const triggers: sdk.NDU.Trigger[] = []

    for (const flow of flows) {
      const topicName = flow.name.split('/')[0]
      const flowName = flow.name.replace(/\.flow\.json$/i, '')
      this._allTopicIds.add(topicName)
      this._allWfIds.add(flowName)

      for (const node of flow.nodes) {
        if (node.type === ('listener' as sdk.FlowNodeType)) {
          this._allNodeIds.add(node.id)
        }

        if (node.type === 'trigger') {
          const tn = node as sdk.TriggerNode
          triggers.push(<sdk.NDU.WorkflowTrigger>{
            conditions: tn.conditions.map(x => ({
              ...x,
              params: { ...x.params, topicName, wfName: flowName }
            })),
            type: 'workflow',
            workflowId: flowName,
            activeWorkflow: tn.activeWorkflow,
            nodeId: tn.name
          })
        } else if ((<sdk.ListenNode>node)?.triggers?.length) {
          const ln = node as sdk.ListenNode
          triggers.push(
            ...ln.triggers.map(
              trigger =>
                <sdk.NDU.NodeTrigger>{
                  nodeId: ln.name,
                  conditions: trigger.conditions.map(x => ({
                    ...x,
                    params: { ...x.params, topicName, wfName: flowName }
                  })),
                  type: 'node',
                  workflowId: flowName
                }
            )
          )
        }
      }
    }

    for (const faq of faqs) {
      for (const topicName of faq.contexts) {
        triggers.push(<sdk.NDU.FaqTrigger>{
          topicName,
          conditions: [
            {
              id: 'user_intent_is',

              params: {
                intentName: faq.name,
                topicName
              }
            }
          ],
          faqId: faq.name,
          type: 'faq'
        })
      }
    }

    this._allTriggers.set(botId, triggers)
  }
}
