import { TrainInput as StanTrainInput, TrainingState as StanTrainingState } from '@botpress/nlu-client'
import crypto from 'crypto'
import _ from 'lodash'
import { DefinitionsRepository } from '../definitions-repository'

import { ModelEntryService, TrainingEntryService, ModelEntry } from '../model-entry'

import { NLUClient } from '../nlu-client'
import { mapTrainSet } from '../nlu-client/api-mapper'

import { BotDefinition } from '../typings'
import { orderKeys } from './order-keys'

export class BotState {
  private _botId: string
  private _seed: number

  constructor(
    botDef: BotDefinition,
    private _nluClient: NLUClient,
    private _defRepo: DefinitionsRepository,
    private _models: ModelEntryService,
    private _trainings: TrainingEntryService
  ) {
    this._botId = botDef.botId
    this._seed = botDef.seed
  }

  public startTraining = async (language: string): Promise<ModelEntry> => {
    const trainSet = await this._getTrainSet(language)
    const modelId = await this._nluClient.startTraining(this._botId, trainSet)
    const definitionHash = this._hashTrainSet(trainSet)
    const entry: ModelEntry = { botId: this._botId, language, modelId, definitionHash }
    await this._trainings.set(entry)
    return entry
  }

  public cancelTraining = async (language: string) => {
    const trainingState = await this._trainings.get({ botId: this._botId, language })
    if (trainingState) {
      await this._nluClient.cancelTraining(this._botId, trainingState.modelId)
    }
  }

  public getTraining = async (language: string): Promise<(StanTrainingState & ModelEntry) | undefined> => {
    const trainKey = { botId: this._botId, language }
    const localTrainingState = await this._trainings.get(trainKey)
    if (!localTrainingState) {
      return
    }

    const { modelId, definitionHash } = localTrainingState
    const remoteTrainingState = await this._nluClient.getTraining(this._botId, modelId)

    const modelEntry: ModelEntry = { botId: this._botId, language, modelId, definitionHash }
    return remoteTrainingState && { ...remoteTrainingState, ...modelEntry }
  }

  public getModel = async (language: string): Promise<ModelEntry | undefined> => {
    const modelKey = { botId: this._botId, language }
    const localModelState = await this._models.get(modelKey)
    if (!localModelState) {
      return
    }

    const remoteModels = await this._nluClient.listModels(this._botId)
    if (remoteModels.includes(localModelState.modelId)) {
      const { modelId, definitionHash } = localModelState
      return { botId: this._botId, language, modelId, definitionHash }
    }
  }

  public setModel = async (language: string, model: ModelEntry) => {
    const { modelId, definitionHash } = model
    await this._trainings.del({ botId: this._botId, language })
    await this._models.set({ botId: this._botId, language, modelId, definitionHash })
  }

  public async isDirty(language: string, model: ModelEntry) {
    const { definitionHash } = model
    const currentTrainSet = await this._getTrainSet(language)
    const currentHash = this._hashTrainSet(currentTrainSet)
    return definitionHash !== currentHash
  }

  private async _getTrainSet(languageCode: string): Promise<StanTrainInput> {
    const defs = await this._defRepo.getTrainDefinitions(this._botId)
    return mapTrainSet({
      ...defs,
      languageCode,
      seed: this._seed
    })
  }

  private _hashTrainSet = (ts: StanTrainInput): string => {
    const { entities, intents } = ts
    const content = orderKeys({
      entities: _.orderBy(entities, e => e.name),
      intents: _.orderBy(intents, i => i.name)
    })

    return crypto
      .createHash('sha1')
      .update(JSON.stringify(content))
      .digest('hex')
  }
}
