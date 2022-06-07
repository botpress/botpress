import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { DefinitionsRepository } from '../definitions-repository'
import { ModelEntryService, TrainingEntryService } from '../model-entry'
import { NLUClient } from '../nlu-client'
import { TrainingSession as BpTrainingSession, BotDefinition } from '../typings'
import { MountOptions } from '.'
import { BotState } from './bot-state'
import { poll } from './polling'

const TRAIN_POLL_INTERVAL = 500

export class Trainer {
  private _botId: string
  private _languages: string[]
  private _botState: BotState

  private _needTrainingWatcher: sdk.ListenHandle

  constructor(
    botDef: BotDefinition,
    private _nluClient: NLUClient,
    private _defRepo: DefinitionsRepository,
    _models: ModelEntryService,
    _trainings: TrainingEntryService,
    private _logger: sdk.Logger,
    private _webSocket: (ts: BpTrainingSession) => void
  ) {
    this._botId = botDef.botId
    this._languages = botDef.languages
    this._botState = new BotState(botDef, _nluClient, _defRepo, _models, _trainings)
  }

  public async mount(opt: MountOptions) {
    this._needTrainingWatcher = this._registerNeedsTrainingWatcher()

    if (!opt.queueTraining) {
      return
    }

    for (const l of this._languages) {
      const { status } = await this.syncAndGetState(l)
      if (status === 'needs-training') {
        // The train function reports progress and handles errors
        void this.train(l)
      }
    }
  }

  public async unmount() {
    this._needTrainingWatcher.remove()
    await Bluebird.each(this._languages, this.cancelTraining.bind(this))
    return this._nluClient.pruneModels(this._botId)
  }

  public train = async (language: string): Promise<void> => {
    try {
      const pending = this._trainPending(language)
      this._webSocket(pending)

      await this._botState.startTraining(language)
      await poll(async () => {
        const ts = await this.syncAndGetState(language)
        this._webSocket(ts)
        const isStillTraining = ts.status === 'training' || ts.status === 'training-pending'
        return isStillTraining ? 'keep-polling' : 'stop-polling'
      }, TRAIN_POLL_INTERVAL)
    } catch (thrown) {
      const err = thrown instanceof Error ? thrown : new Error(`${thrown}`)
      this._logger.attachError(err).error('An error occured when training')

      const needsTraining = this._needsTraining(language)
      this._webSocket({ ...needsTraining, error: { message: err.message, type: 'internal' } })
    }
  }

  public syncAndGetState = async (language: string): Promise<BpTrainingSession> => {
    const needsTraining = this._needsTraining(language)
    const doneTraining = this._doneTraining(language)

    const training = await this._botState.getTraining(language)
    if (training) {
      if (training.status === 'done') {
        await this._botState.setModel(language, training) // erases the training
        return doneTraining
      }

      if (training.status === 'training' || training.status === 'training-pending') {
        const { status, progress } = training
        return { status, progress, language, botId: this._botId }
      }

      // canceled or error
      const { error } = training
      return { ...needsTraining, error }
    }

    const model = await this._botState.getModel(language)
    if (model) {
      const isDirty = await this._botState.isDirty(language, model)
      if (!isDirty) {
        return doneTraining
      }
    }

    return needsTraining
  }

  public cancelTraining = async (language: string) => {
    await this._botState.cancelTraining(language)
  }

  private _registerNeedsTrainingWatcher = () => {
    return this._defRepo.onFileChanged(this._botId, async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }

      await Promise.map(this._languages, async language => {
        const { status, progress } = await this.syncAndGetState(language)
        this._webSocket({ status, progress, botId: this._botId, language })
      })
    })
  }

  private _needsTraining = (language: string): BpTrainingSession => ({
    status: 'needs-training',
    progress: 0,
    language,
    botId: this._botId
  })

  private _trainPending = (language: string): BpTrainingSession => ({
    status: 'training-pending',
    progress: 0,
    language,
    botId: this._botId
  })

  private _doneTraining = (language: string): BpTrainingSession => ({
    status: 'done',
    progress: 1,
    language,
    botId: this._botId
  })
}
