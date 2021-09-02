import { TrainingState as StanTrainingState, TrainingStatus as StanTrainingStatus } from '@botpress/nlu-client'
import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import { DefinitionsRepository } from '../definitions-repository'
import { ModelStateService, ModelState } from '../model-state-service'
import { NLUClientWrapper, TrainListener } from '../nlu-client'
import { mapTrainSet } from '../nlu-client/api-mapper'
import {
  TrainingState as BpTrainingState,
  TrainingSession as BpTrainingSession,
  BotDefinition,
  TrainingSet as BpTrainingSet
} from '../typings'
import { MountOptions } from '.'

type BpTrainingStatus = sdk.NLU.TrainingStatus

export class Trainer {
  private _botId: string
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle

  constructor(
    botDef: BotDefinition,
    private _nluClient: NLUClientWrapper,
    private _defRepo: DefinitionsRepository,
    private _modelStateService: ModelStateService,
    private _webSocket: (ts: BpTrainingSession) => void,
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
    await Bluebird.each(this._languages, this.cancelTraining.bind(this))
    return this._nluClient.pruneModels(this._botId)
  }

  public train = async (language: string): Promise<void> => {
    try {
      const bpTrainSet = await this._getTrainSet(language)
      const modelId = await this._nluClient.startTraining(this._botId, mapTrainSet(bpTrainSet))
      await this._modelStateService.setTrainingStarted(this._botId, language, modelId, bpTrainSet)
      const listener = this._getTrainingListener(language)
      await this._nluClient.listenForTraining(this._botId, modelId, listener)
    } catch (err) {
      this._logger.attachError(err).error('An error occured during training.')
    }
  }

  private _getTrainingListener = (language: string): TrainListener => async (ts: StanTrainingState) => {
    if (ts.status === 'training-pending' || ts.status === 'training') {
      this._webSocket({ ...ts, botId: this._botId, language })
      return { keepListening: true }
    }

    if (ts.status === 'errored' && ts.error?.type === 'already-started') {
      // no notification needed to websocket
      this._logger.info(`Training ${this._botId}:${language} already started`)
      return { keepListening: false }
    }

    if (ts.status === 'done') {
      this._webSocket({ ...ts, botId: this._botId, language })
      await this._modelStateService.setTrainingDone(this._botId, language)
      return { keepListening: false }
    }

    if (ts.status === 'canceled') {
      this._webSocket({ status: 'needs-training', progress: 0, botId: this._botId, language })
      this._logger.info(`Training ${this._botId}:${language} was canceled with success`)
      return { keepListening: false }
    }

    if (ts.status === 'errored') {
      this._webSocket({ ...ts, botId: this._botId, language })
      const err = new Error(ts.error?.message ?? 'A weird unkown error occured')
      err.stack = ts.error?.stackTrace
      return { keepListening: false, err }
    }

    throw new Error(`Training status is unknown: "${ts.status}""`)
  }

  public getTraining = async (language: string): Promise<BpTrainingState> => {
    const needsTrainingState: BpTrainingState = { status: 'needs-training', progress: 0 }

    const localTrainingState = await this._modelStateService.getLocalTrainingState(this._botId, language)
    if (localTrainingState) {
      const remoteTrainingState = await this._fetchRemoteModelState(localTrainingState)
      return remoteTrainingState ?? needsTrainingState
    }

    const localModelState = await this._modelStateService.getLocalModelState(this._botId, language)
    const trainSet = await this._getTrainSet(language)
    if (localModelState?.isDirty(trainSet)) {
      return needsTrainingState
    }

    if (localModelState) {
      const remoteModelState = await this._fetchRemoteModelState(localModelState)
      return remoteModelState ?? needsTrainingState
    }

    return needsTrainingState
  }

  private async _fetchRemoteModelState(localModelState: ModelState): Promise<BpTrainingState | undefined> {
    const remoteModelState = await this._nluClient.getTraining(this._botId, localModelState.id)
    if (!remoteModelState) {
      return
    }
    const { status, progress } = remoteModelState
    return { progress, status: this._mapStatus(status) }
  }

  public cancelTraining = async (language: string) => {
    this._webSocket({ botId: this._botId, language, status: 'canceled', progress: 0 })
    const model = await this._modelStateService.getLocalTrainingState(this._botId, language)
    if (model) {
      await this._nluClient.cancelTraining(this._botId, model.id)
      setTimeout(async () => {
        const currentTraining = await this.getTraining(language)
        this._webSocket({ ...currentTraining, botId: this._botId, language })
      }, ms('1s'))
    }
  }

  private _mapStatus = (status: StanTrainingStatus): BpTrainingStatus => {
    const needsTrainingsStatuses: BpTrainingStatus[] = ['errored', 'canceled']
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
        const model = await this._modelStateService.getLocalModelState(this._botId, language)
        const trainSet = await this._getTrainSet(language)
        const isDirty = !model || model.isDirty(trainSet)
        if (isDirty) {
          this._webSocket({ status: 'needs-training', progress: 0, botId: this._botId, language })
        }
      })
    })
  }
}
