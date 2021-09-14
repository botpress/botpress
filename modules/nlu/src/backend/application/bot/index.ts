import { TrainingState as StanTrainingState } from '@botpress/nlu-client'
import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { DefinitionsRepository } from '../definitions-repository'
import { BotDoesntSpeakLanguageError } from '../errors'
import { ModelStateService } from '../model-state'
import { NLUClient } from '../nlu-client'
import {
  TrainingState as BpTrainingState,
  TrainingSession as BpTrainingSession,
  BotDefinition,
  TrainingSet as BpTrainingSet,
  ConfigResolver
} from '../typings'
import { ModelStateSynchronizer } from './model-state-synchronizer'

export interface MountOptions {
  queueTraining: boolean
}

export class Bot {
  private _botId: string
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle

  private _synchronizer: ModelStateSynchronizer

  constructor(
    botDef: BotDefinition,
    private _configResolver: ConfigResolver,
    private _nluClient: NLUClient,
    private _defRepo: DefinitionsRepository,
    private _modelStateService: ModelStateService,
    private _webSocket: (ts: BpTrainingSession) => void,
    private _logger: sdk.Logger
  ) {
    this._botId = botDef.botId
    this._languages = botDef.languages
    this._seed = botDef.seed

    this._synchronizer = new ModelStateSynchronizer(botDef, _nluClient, _modelStateService)
  }

  get id() {
    return this._botId
  }

  get languages() {
    return this._languages
  }

  public async mount(opt: MountOptions) {
    this._needTrainingWatcher = this._registerNeedsTrainingWatcher()

    this._synchronizer.onModelReady(this._updateBotConfig.bind(this))

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

  public async unmount() {
    this._needTrainingWatcher.remove()
    await Bluebird.each(this._languages, this.cancelTraining.bind(this))
  }

  public train = async (language: string): Promise<void> => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }

    const botId = this._botId

    try {
      const trainset = await this._getTrainSet(language)
      const modelId = await this._nluClient.startTraining(this._botId, trainset)

      const status = 'training-pending'
      const statusType = 'not-ready'
      const progress = 0
      await this._modelStateService.create({ botId, language, modelId, progress, status, statusType, trainset })

      await this._nluClient.listenForTraining(this._botId, modelId, async ts => {
        await this._synchronizer.updateLocalTrainingState(language, ts)
        return this._handleTrainingUpdate(language, ts)
      })
    } catch (err) {
      this._logger.attachError(err).error('An error occured during training.')
    }
  }

  private _handleTrainingUpdate = async (language: string, ts: StanTrainingState | undefined) => {
    if (!ts) {
      this._webSocket({ botId: this._botId, language, status: 'needs-training', progress: 0 })
      return { keepListening: false }
    }

    if (ts.status === 'training-pending' || ts.status === 'training') {
      this._webSocket({ ...ts, botId: this._botId, language })
      return { keepListening: true }
    }

    if (ts.status === 'done') {
      this._webSocket({ ...ts, botId: this._botId, language })
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

    const err = new Error(`Training status is unknown: "${ts.status}"`)
    return { keepListening: false, err }
  }

  public getTraining = async (language: string): Promise<BpTrainingState> => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }

    const needsTrainingState: BpTrainingState = { status: 'needs-training', progress: 0 }

    const trainingState = await this._synchronizer.getTrainingState(language)
    if (trainingState?.status === 'errored' || trainingState?.status === 'canceled') {
      return needsTrainingState
    }

    if (trainingState) {
      const { status, progress } = trainingState
      return { status, progress }
    }

    const modelState = await this._synchronizer.getModelState(language)
    if (!modelState) {
      return needsTrainingState
    }

    const trainSet = await this._getTrainSet(language)
    if (modelState.isDirty(trainSet)) {
      return needsTrainingState
    }

    const { status, progress } = modelState
    return { status, progress }
  }

  public cancelTraining = async (language: string) => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }

    this._webSocket({ botId: this._botId, language, status: 'canceled', progress: 0 })
    const trainingState = await this._modelStateService.get({ botId: this._botId, language, statusType: 'not-ready' })
    if (trainingState) {
      await this._nluClient.cancelTraining(this._botId, trainingState.modelId)
    }
  }

  private async _updateBotConfig(language: string, modelId: string) {
    const botConfig = await this._configResolver.getBotById(this._botId)
    if (!botConfig) {
      throw new Error(`No config found for bot "${this._botId}"`)
    }
    let { nluModels } = botConfig
    nluModels = { ...nluModels, [language]: modelId }
    return this._configResolver.mergeBotConfig(this._botId, {
      nluModels
    })
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
        const { status, progress } = await this.getTraining(language)
        this._webSocket({ status, progress, botId: this._botId, language })
      })
    })
  }
}
