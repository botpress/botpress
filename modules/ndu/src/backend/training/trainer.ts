import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { broadcastLoadModel } from '..'
import { Features, InputData, Model } from '../typings'
import { computeModelHash } from '../utils'

import { BASE_DATA } from './base-data'

const debug = DEBUG('ndu').sub('training')

export const ActionTypes = <const>[
  'faq_trigger_outside_topic',
  'faq_trigger_inside_topic',
  'wf_trigger_inside_topic',
  'wf_trigger_outside_topic',
  'wf_trigger_inside_wf',
  'faq_trigger_inside_wf',
  'node_trigger_inside_wf',
  'contextual_trigger'
]

export type ActionType = typeof ActionTypes[number]
export type ActionPredictions = { [key in ActionType]: number }

export const MODELS_DIR = './models'

const newFeature = (): Features => ({
  conf_faq_trigger_inside_topic: 0,
  conf_faq_trigger_outside_topic: 0,
  conf_faq_trigger_parameter: 0,
  conf_node_trigger_inside_wf: 0,
  conf_wf_trigger_inside_topic: 0,
  conf_wf_trigger_inside_wf: 0,
  conf_wf_trigger_outside_topic: 0,
  conf_contextual_trigger: 0,
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

const makeFileName = (hash: string): string => `${hash}.ndu.model`

export const getModel = async (ghost: sdk.ScopedGhostService, hash: string) => {
  const filename = makeFileName(hash)
  if (await ghost.fileExists(MODELS_DIR, filename)) {
    try {
      return ghost.readFileAsObject<Model>(MODELS_DIR, filename)
    } catch (err) {
      await ghost.deleteFile(MODELS_DIR, filename)
    }
  }
}

export const pruneModels = async (ghost: sdk.ScopedGhostService, modelToKeep: string): Promise<void | void[]> => {
  const models = await ghost.directoryListing(MODELS_DIR, '*.ndu.model')
  const modelsToRemove = models.filter(x => x !== modelToKeep)

  return Promise.map(modelsToRemove, file => ghost.deleteFile(MODELS_DIR, file))
}

export class Trainer {
  trainer: sdk.MLToolkit.SVM.Trainer
  private ghost: sdk.ScopedGhostService

  constructor(private bp: typeof sdk, private botId: string) {
    this.trainer = new this.bp.MLToolkit.SVM.Trainer()
    this.ghost = this.bp.ghost.forBot(this.botId)
  }

  async trainOrLoad(inputData: InputData[]) {
    const lock = await this.bp.distributed.acquireLock(`ndu-training-${this.botId}`, ms('5m'))
    if (!lock) {
      return
    }

    const hash = computeModelHash(inputData)

    let model = await getModel(this.ghost, hash)
    if (!model) {
      model = await this.startTraining(inputData, hash)

      if (model.success) {
        debug('Model trained successfully', { botId: this.botId })
        const fileName = makeFileName(hash)

        await this.ghost.upsertFile(MODELS_DIR, fileName, JSON.stringify(model))
        await pruneModels(this.ghost, fileName)
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
    debug('Start training for bot', { botId: this.botId })

    const model: Partial<Model> = {
      startedAt: new Date(),
      hash
    }

    try {
      const duplicatedArray = _.shuffle(_.flatten(_.times(10, () => inputData)))

      model.data = await this.trainer.train(duplicatedArray)
      model.success = true
    } catch (err) {
      this.bp.logger.attachError(err).error('Could not finish training NDU model')

      model.success = false
    } finally {
      model.finishedAt = new Date()
      return model as Model
    }
  }
}
