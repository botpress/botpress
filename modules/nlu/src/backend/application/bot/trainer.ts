import { TrainingStatus, TrainingState as ServerState } from '@botpress/nlu-client'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import { DefinitionsRepository } from '../definitions-repository'
import { ModelStateService } from '../model-state-service'
import { NLUClientWrapper, TrainListener } from '../nlu-client'
import { TrainingState as BpState, TrainingSession, BotDefinition, BpTrainingSet } from '../typings'
import { MountOptions } from '.'

export interface ITrainer {
  train(language: string): Promise<void>
  getTraining(language: string): Promise<BpState>
  cancelTraining(language: string): Promise<void>
}

export class Trainer implements ITrainer {
  private _botId: string
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle

  constructor(
    botDef: BotDefinition,
    private _nluClient: NLUClientWrapper,
    private _defRepo: DefinitionsRepository,
    private _modelStateService: ModelStateService,
    private _webSocket: (ts: TrainingSession) => void,
    private _logger: sdk.Logger
  ) {
    this._botId = botDef.botId
    this._languages = botDef.languages
    this._seed = botDef.seed
  }

  public async initialize(opt: MountOptions) {
    this._needTrainingWatcher = this._registerNeedTrainingWatcher()

    if (!opt.queueTraining) {
      return
    }

    for (const l of this._languages) {
      const { status } = await this.getTraining(l)
      if (status === 'needs-training') {
        // The train function reports progress and handles errors
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.train(l)
      }
    }
  }

  public async teardown() {
    this._needTrainingWatcher.remove()
    // TODO: cancel all trainings
    return this._nluClient.pruneModels(this._botId)
  }

  public train = async (language: string): Promise<void> => {
    try {
      const bpTrainSet = await this._getTrainSet(language)
      const modelId = await this._nluClient.startTraining(this._botId, bpTrainSet)
      await this._modelStateService.trainingStarted(this._botId, language, modelId, bpTrainSet)
      const listener = this._getTrainingListener(language)
      await this._nluClient.listenForTraining(this._botId, modelId, listener)
    } catch (err) {
      this._logger.attachError(err).error('An error occured during training.')
    }
  }

  private _getTrainingListener = (language: string): TrainListener => async (ts: ServerState | undefined) => {
    if (!ts) {
      return 'keep-listening'
    }

    if (ts.status === 'training-pending' || ts.status === 'training') {
      this._webSocket({ ...ts, botId: this._botId, language })
      return 'keep-listening'
    }

    if (ts.status === 'errored' && ts.error?.type === 'already-started') {
      // no notification needed to websocket
      this._logger.info(`Training ${this._botId}:${language} already started`)
      return 'stop-listening'
    }

    if (ts.status === 'done') {
      this._webSocket({ ...ts, botId: this._botId, language })
      await this._modelStateService.trainingDone(this._botId, language)
      return 'stop-listening'
    }

    if (ts.status === 'canceled') {
      this._webSocket({ status: 'needs-training', progress: 0, botId: this._botId, language })
      this._logger.info(`Training ${this._botId}:${language} was canceled with success`)
      return 'stop-listening'
    }

    if (ts.status === 'errored' && ts.error?.type === 'unknown') {
      this._webSocket({ ...ts, botId: this._botId, language })
      const err = new Error(ts.error.message)
      err.stack = ts.error.stackTrace
      throw err
    }

    throw new Error(`Training status is unknown: "${ts.status}"`)
  }

  public getTraining = async (language: string): Promise<BpState> => {
    const defaultTrainState = { status: <TrainingStatus>'needs-training', progress: 0 }

    const currentTraining = await this._modelStateService.getTraining(this._botId, language)
    if (currentTraining) {
      const trainState = await this._nluClient.getTraining(this._botId, currentTraining.id)
      if (!trainState) {
        return defaultTrainState
      }

      const { status, progress } = trainState
      return { progress, status: this._mapStatus(status) }
    }

    const model = await this._modelStateService.getModel(this._botId, language)
    if (model) {
      const trainState = await this._nluClient.getTraining(this._botId, model.id)
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
      await this._nluClient.cancelTraining(this._botId, model.id)
      setTimeout(async () => {
        const currentTraining = await this.getTraining(language)
        this._webSocket({ ...currentTraining, botId: this._botId, language })
      }, ms('1s'))
    }
  }

  private _mapStatus = (status: TrainingStatus): sdk.NLU.TrainingStatus => {
    const needsTrainingsStatuses: TrainingStatus[] = ['errored', 'canceled']
    if (needsTrainingsStatuses.includes(status)) {
      return 'needs-training'
    }
    return status
  }

  private async _getTrainSet(languageCode: string): Promise<BpTrainingSet> {
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
