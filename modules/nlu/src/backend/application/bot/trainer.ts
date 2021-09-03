import {
  TrainingState as StanTrainingState,
  TrainingState,
  TrainingStatus as StanTrainingStatus
} from '@botpress/nlu-client'
import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import { DefinitionsRepository } from '../definitions-repository'
import { ModelStateKey, ModelStateService } from '../model-state'
import { NLUClientWrapper, TrainListener } from '../nlu-client'
import { mapTrainSet } from '../nlu-client/api-mapper'
import {
  TrainingState as BpTrainingState,
  TrainingSession as BpTrainingSession,
  BotDefinition,
  TrainingSet as BpTrainingSet
} from '../typings'
import { MountOptions } from '.'

const sleep = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms)
  })

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
    this._needTrainingWatcher = this._registerNeedsTrainingWatcher()

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

  private async _syncWithRemote(language: string) {
    const botId = this._botId
    const localModelState = await this._modelStateService.get({ botId, language, statusType: 'ready' })
    if (localModelState) {
      const remoteModelState = await this._nluClient.getTraining(this._botId, localModelState.modelId)
      if (!remoteModelState || remoteModelState.status !== 'done') {
        await this._modelStateService.delete({ botId, language, statusType: 'ready' })
      }
    }

    const localTrainState = await this._modelStateService.get({ botId, language, statusType: 'not-ready' })
    if (!localTrainState) {
      return
    }

    const { modelId } = localTrainState
    const remoteTrainingState = await this._nluClient.getTraining(this._botId, modelId)
    if (!remoteTrainingState) {
      await this._modelStateService.delete({ botId, language, statusType: 'not-ready' })
      return
    }

    return this._syncTrainingState(language, remoteTrainingState, { notify: false })
  }

  public train = async (language: string): Promise<void> => {
    const botId = this._botId

    try {
      const trainset = await this._getTrainSet(language)
      const modelId = await this._nluClient.startTraining(this._botId, mapTrainSet(trainset))

      await this._modelStateService.create({
        botId,
        language,
        modelId,
        progress: 0,
        status: 'training-pending',
        statusType: 'not-ready',
        trainset
      })

      const listener = (ts: TrainingState) => this._syncTrainingState(language, ts)
      await this._nluClient.listenForTraining(this._botId, modelId, listener)
    } catch (err) {
      this._logger.attachError(err).error('An error occured during training.')
    }
  }

  private _syncTrainingState = async (
    language: string,
    ts: StanTrainingState,
    opt: { notify: boolean } = { notify: true }
  ) => {
    const botId = this._botId

    if (ts.status === 'training-pending' || ts.status === 'training') {
      opt.notify && this._webSocket({ ...ts, botId: this._botId, language })
      const { status, progress } = ts
      await this._modelStateService.update({ botId, language, statusType: 'not-ready', status, progress })
      return { keepListening: true }
    }

    if (ts.status === 'done') {
      opt.notify && this._webSocket({ ...ts, botId: this._botId, language })
      await this._modelStateService.setReady({ botId, language, status: 'done', progress: 1 })
      return { keepListening: false }
    }

    if (ts.status === 'canceled') {
      opt.notify && this._webSocket({ status: 'needs-training', progress: 0, botId: this._botId, language })
      this._logger.info(`Training ${this._botId}:${language} was canceled with success`)
      await this._modelStateService.delete({ botId, language, statusType: 'not-ready' })
      return { keepListening: false }
    }

    if (ts.status === 'errored' && ts.error?.type === 'already-started') {
      // no notification needed to websocket
      this._logger.info(`Training ${this._botId}:${language} already started`)
      await this._modelStateService.delete({ botId, language, statusType: 'not-ready' })
      return { keepListening: false }
    }

    if (ts.status === 'errored') {
      opt.notify && this._webSocket({ ...ts, botId: this._botId, language })
      const err = new Error(ts.error?.message ?? 'A weird unkown error occured')
      err.stack = ts.error?.stackTrace
      await this._modelStateService.delete({ botId, language, statusType: 'not-ready' })
      return { keepListening: false, err }
    }

    throw new Error(`Training status is unknown: "${ts.status}""`)
  }

  public getTraining = async (language: string): Promise<BpTrainingState> => {
    await this._syncWithRemote(language)
    return this._getTraining(language)
  }

  private _getTraining = async (language: string): Promise<BpTrainingState> => {
    const needsTrainingState: BpTrainingState = { status: 'needs-training', progress: 0 }

    const botId = this._botId

    const localTrainingState = await this._modelStateService.get({ botId, language, statusType: 'not-ready' })
    if (localTrainingState) {
      const { status, progress } = localTrainingState
      return { status, progress }
    }

    const localModelState = await this._modelStateService.get({ botId, language, statusType: 'ready' })
    if (!localModelState) {
      return needsTrainingState
    }

    const trainSet = await this._getTrainSet(language)
    if (localModelState?.isDirty(trainSet)) {
      return needsTrainingState
    }

    const { status, progress } = localModelState
    return { status, progress }
  }

  public cancelTraining = async (language: string) => {
    this._webSocket({ botId: this._botId, language, status: 'canceled', progress: 0 })
    await this._syncWithRemote(language)

    const botId = this._botId

    const model = await this._modelStateService.get({ botId, language, statusType: 'not-ready' })
    if (model) {
      await this._nluClient.cancelTraining(this._botId, model.modelId)
    }

    await sleep(ms('1s'))

    await this._syncWithRemote(language)
    const currentTraining = await this._getTraining(language)
    this._webSocket({ ...currentTraining, botId: this._botId, language })
  }

  private async _getTrainSet(languageCode: string): Promise<BpTrainingSet> {
    const trainDefinitions = await this._defRepo.getTrainDefinitions(this._botId)
    return {
      ...trainDefinitions,
      languageCode,
      seed: this._seed
    }
  }

  private _registerNeedsTrainingWatcher = () => {
    return this._defRepo.onFileChanged(this._botId, async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }

      await Promise.map(this._languages, async language => {
        await this._syncWithRemote(language)
        const { status, progress } = await this._getTraining(language)
        this._webSocket({ status, progress, botId: this._botId, language })
      })
    })
  }
}
