import { TrainingStatus } from '@botpress/nlu-client'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { StanEngine } from 'src/backend/stan'
import { mapTrainSet } from '../../stan/api-mapper'
import { DefinitionsRepository } from '../definitions-repository'
import { ModelStateService } from '../model-state-service'
import { TrainingState, TrainingSession, BotDefinition } from '../typings'

interface TrainingSet {
  intentDefs: sdk.NLU.IntentDefinition[]
  entityDefs: sdk.NLU.EntityDefinition[]
  languageCode: string
  seed: number // seeds random number generator in nlu training
}

export interface ITrainer {
  train(language: string): Promise<void>
  getTraining(language: string): Promise<TrainingState>
  cancelTraining(language: string): Promise<void>
}

export class Trainer implements ITrainer {
  private _botId: string
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle

  constructor(
    botDef: BotDefinition,
    private _engine: StanEngine,
    private _defRepo: DefinitionsRepository,
    private _modelStateService: ModelStateService,
    private _webSocket: (ts: TrainingSession) => void,
    private _logger: sdk.Logger
  ) {
    this._botId = botDef.botId
    this._languages = botDef.languages
    this._seed = botDef.seed
  }

  public async initialize() {
    this._needTrainingWatcher = this._registerNeedTrainingWatcher()
  }

  public async teardown() {
    this._needTrainingWatcher.remove()
    // TODO: cancel all trainings
    return this._engine.pruneModels(this._botId)
  }

  public train = async (language: string): Promise<void> => {
    const { _engine, _defRepo: _defService, _botId } = this

    const bpTrainSet = await this._getTrainSet(language)
    const stanTrainSet = mapTrainSet(bpTrainSet)

    return new Promise(async (resolve, reject) => {
      const modelId = await _engine.startTraining(this._botId, stanTrainSet)
      await this._modelStateService.trainingStarted(this._botId, language, modelId, bpTrainSet)

      this._engine.listenForTraining(this._botId, modelId, async ts => {
        if (!ts) {
          return 'keep-listening'
        }

        if (ts.status === 'training-pending' || ts.status === 'training') {
          this._webSocket({ ...ts, botId: this._botId, language })
          return 'keep-listening'
        }

        if (ts.status === 'errored' && ts.error?.type === 'already-started') {
          // no notification needed to websocket
          this._logger.info(`Training ${_botId}:${language} already started`)
          resolve()
          return 'stop-listening'
        }

        if (ts.status === 'done') {
          this._webSocket({ ...ts, botId: this._botId, language })
          await this._modelStateService.trainingDone(this._botId, language)
          resolve()
          return 'stop-listening'
        }

        if (ts.status === 'canceled') {
          this._webSocket({ status: 'needs-training', progress: 0, botId: this._botId, language })
          this._logger.info(`Training ${_botId}:${language} was canceled with success`)
          await this._modelStateService.trainingAborted(this._botId, language)
          resolve()
          return 'stop-listening'
        }

        if (ts.status === 'errored' && ts.error?.type === 'unknown') {
          this._webSocket({ ...ts, botId: this._botId, language })
          const err = new Error(ts.error.message)
          err.stack = ts.error.stackTrace
          await this._modelStateService.trainingAborted(this._botId, language)
          reject(err)
          return 'stop-listening'
        }

        return 'keep-listening'
      })
    })
  }

  public getTraining = async (language: string): Promise<TrainingState> => {
    const defaultTrainState = { status: <TrainingStatus>'needs-training', progress: 0 }

    const currentTraining = await this._modelStateService.getTraining(this._botId, language)
    if (currentTraining) {
      const trainState = await this._engine.getTraining(this._botId, currentTraining.id)
      if (!trainState) {
        return defaultTrainState
      }

      const { status, progress } = trainState
      return { progress, status: this._mapStatus(status) }
    }

    const model = await this._modelStateService.getModel(this._botId, language)
    if (model) {
      const trainState = await this._engine.getTraining(this._botId, model.id)
      if (!trainState) {
        return defaultTrainState
      }

      const { status, progress } = trainState
      const trainSet = await this._getTrainSet(language)
      return model.isDirty(trainSet) ? defaultTrainState : { progress, status: this._mapStatus(status) }
    }

    return defaultTrainState
  }

  public cancelTraining = async (language: string) => {
    this._webSocket({ botId: this._botId, language, status: 'canceled', progress: 0 })
    const model = await this._modelStateService.getTraining(this._botId, language)
    if (model) {
      return this._engine.cancelTraining(this._botId, model.id)
    }
  }

  private _mapStatus = (status: TrainingStatus): sdk.NLU.TrainingStatus => {
    const needsTrainingsStatuses: TrainingStatus[] = ['errored', 'canceled']
    if (needsTrainingsStatuses.includes(status)) {
      return 'needs-training'
    }
    return status
  }

  private async _getTrainSet(languageCode: string): Promise<TrainingSet> {
    const trainDefinitions = await this._defRepo.getTrainDefinitions(this._botId)

    return {
      ...trainDefinitions,
      languageCode,
      seed: this._seed
    }
  }

  private _registerNeedTrainingWatcher = () => {
    return this._defRepo.onFileChanged(this._botId, async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }

      await Promise.map(this._languages, async language => {
        const model = await this._modelStateService.getModel(this._botId, language)
        const trainSet = await this._getTrainSet(language)
        const isDirty = !model || model.isDirty(trainSet)
        if (isDirty) {
          this._webSocket({ status: 'needs-training', progress: 0, botId: this._botId, language })
        }
      })
    })
  }
}
