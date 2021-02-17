import * as sdk from 'botpress/sdk'

import { ITrainingRepository } from './memory-training-repo'
import { TrainingId, TrainingQueue, TrainerService, TrainingListener, TrainingState, TrainingSession } from './typings'

export interface TrainingQueueOptions {
  maxTraining: number
}

const DEFAULT_OPTIONS: TrainingQueueOptions = {
  maxTraining: 2
}

const DEFAULT_STATUS: TrainingState = { status: 'idle', progress: 0 }

export class InMemoryTrainingQueue implements TrainingQueue {
  private _options: TrainingQueueOptions

  constructor(
    private _trainings: ITrainingRepository,
    private _errors: typeof sdk.NLU.errors,
    private _logger: sdk.Logger,
    private _trainerService: TrainerService,
    private _onChange: TrainingListener,
    options: Partial<TrainingQueueOptions> = {}
  ) {
    this._options = { ...DEFAULT_OPTIONS, ...options }
  }

  async initialize() {}

  async teardown() {
    const currentTrainings = this._trainings.query({ status: 'training' })
    await Promise.mapSeries(currentTrainings, this.cancelTraining)
    this._trainings.clear()
  }

  async needsTraining(trainId: TrainingId): Promise<void> {
    const currentTraining = this._trainings.get(trainId)
    if (currentTraining?.status === 'training') {
      return // do not notify socket if currently training
    }
    return this._update(trainId, { status: 'needs-training' })
  }

  async queueTraining(trainId: TrainingId): Promise<void> {
    const currentTraining = this._trainings.get(trainId)
    if (currentTraining?.status === 'training') {
      this._logger.warn('Training already started')
      return // do not queue training if currently training
    }
    await this._update(trainId, { status: 'training-pending' })

    return this._runTask()
  }

  cancelTraining = async (trainId: TrainingId): Promise<void> => {
    const { botId, language } = trainId

    const currentTraining = this._trainings.get(trainId)
    if (!currentTraining) {
      return
    }

    if (currentTraining.status === 'training-pending') {
      return this._update(trainId, { status: 'needs-training' })
    }

    if (currentTraining.status === 'training') {
      await this._notify(trainId, { status: 'canceled', progress: 0 })
      const trainer = this._trainerService.getBot(botId)
      if (trainer) {
        await trainer.cancelTraining(language)
      } else {
        // This case should never happend
        this._logger.warn(`About to cancel training for ${botId}, but no bot found.`)
      }

      return this._update(trainId, { status: 'needs-training' })
    }

    this._logger.warn(`No training canceled as ${botId} is not currently training language ${language}.`)
  }

  async getTraining(trainId: TrainingId): Promise<TrainingState> {
    return this._trainings.get(trainId) ?? DEFAULT_STATUS
  }

  async cancelTrainings(botId: string): Promise<void[]> {
    const currentTrainings = this._trainings.getAll().filter(ts => ts.botId === botId)
    return Promise.mapSeries(currentTrainings, t => this.cancelTraining(t))
  }

  async getAllTrainings(): Promise<TrainingSession[]> {
    return this._trainings.getAll()
  }

  private _update = (id: TrainingId, training: Partial<TrainingState>) => {
    const current = this._trainings.get(id) ?? DEFAULT_STATUS
    if (training.status) {
      current.status = training.status
    }
    if (training.progress) {
      current.progress = training.progress
    }
    this._trainings.set(id, current)
    return this._notify(id, current)
  }

  private _notify = async (trainId: TrainingId, state: TrainingState) => {
    return this._onChange({ ...trainId, ...state })
  }

  private _runTask = async () => {
    if (this._trainings.query({ status: 'training' }).length >= this._options.maxTraining) {
      return
    }

    const pendings = this._trainings.query({ status: 'training-pending' })
    if (pendings.length <= 0) {
      return
    }

    const next = pendings[0]
    this._trainings.set(next, { status: 'training', progress: 0 }) // wait for the first progress update to notify socket

    // floating promise to return fast from task
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._train(next)
  }

  private _train = async (trainId: TrainingId) => {
    const { botId, language } = trainId
    const trainer = this._trainerService.getBot(botId)
    if (!trainer) {
      // This case should never happend
      this._logger.warn(`About to train ${botId}, but no bot found.`)
      return this._update(trainId, { status: 'needs-training' })
    }

    try {
      const modelId = await trainer.train(language, async (progress: number) => {
        await this._update(trainId, { progress })
      })
      await this._update(trainId, { status: 'done', progress: 1 })
      await trainer.load(modelId)
    } catch (err) {
      await this._handleTrainError(trainId, err)
    } finally {
      await this._runTask()
    }
  }

  private _handleTrainError = async (trainId: TrainingId, err: Error) => {
    const { botId } = trainId

    if (this._errors.isTrainingCanceled(err)) {
      this._logger.forBot(botId).info('Training cancelled')
      return this._update(trainId, { status: 'needs-training', progress: 0 })
    }

    if (this._errors.isTrainingAlreadyStarted(err)) {
      // This should not happend
      this._logger.forBot(botId).warn('Training already started')
      return
    }

    this._logger
      .forBot(botId)
      .attachError(err)
      .error('Training could not finish because of an unexpected error.')

    await this._notify(trainId, { status: 'errored', progress: 0 })
    this._trainings.set(trainId, { status: 'needs-training', progress: 0 })
  }
}
