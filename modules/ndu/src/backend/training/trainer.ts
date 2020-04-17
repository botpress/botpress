import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { broadcastLoadModel } from '..'
import { Features, InputData } from '../typings'
import { computeModelHash } from '../utils'

import { BASE_DATA } from './base-data'
import * as ModelService from './model-service'

export const ActionTypes = <const>[
  'faq_trigger_outside_topic',
  'faq_trigger_inside_topic',
  'wf_trigger_inside_topic',
  'wf_trigger_outside_topic',
  'wf_trigger_inside_wf',
  'faq_trigger_inside_wf',
  'node_trigger_inside_wf'
]

export type ActionType = typeof ActionTypes[number]
export type ActionPredictions = { [key in ActionType]: number }

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

export const dataset: [Features, ActionType][] = BASE_DATA.map(([feat, label]) => [
  Object.assign(newFeature(), (feat as any) as Features),
  <ActionType>label
])

export class Trainer {
  trainer: sdk.MLToolkit.SVM.Trainer

  constructor(private bp: typeof sdk, private botId: string) {
    this.trainer = new this.bp.MLToolkit.SVM.Trainer()
  }

  async trainOrLoad(inputData: InputData[]) {
    const lock = await this.bp.distributed.acquireLock(`ndu-training-${this.botId}`, ms('5m'))
    if (!lock) {
      return
    }

    const hash = computeModelHash(inputData)
    const ghost = this.bp.ghost.forBot(this.botId)

    await ModelService.pruneModels(ghost)
    let model = await ModelService.getModel(ghost, hash)

    if (!model) {
      model = await this.startTraining(inputData, hash)

      if (model.success) {
        await ModelService.saveModel(ghost, model, hash)
      }
    }

    try {
      if (model.success) {
        await broadcastLoadModel(this.botId, hash)
      }
    } finally {
      await lock.unlock()
    }
  }

  async startTraining(inputData: InputData[], hash: string) {
    const model: Partial<ModelService.Model> = {
      startedAt: new Date(),
      hash
    }

    try {
      const duplicatedArray = _.shuffle(_.flatten(_.times(10, () => inputData)))

      model.data = await this.trainer.train(duplicatedArray)
      model.success = true
    } catch (err) {
      console.log('Could not finish training NDU model', err)

      model.success = false
    } finally {
      model.finishedAt = new Date()
      return model as ModelService.Model
    }
  }
}
