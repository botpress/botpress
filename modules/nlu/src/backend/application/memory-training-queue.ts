import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'

import { TrainingId, TrainingQueue, TrainerService, TrainSessionListener } from './typings'

export interface TrainingQueueOptions {
  maxTraining: number
}

interface TrainStatus {
  status: NLU.TrainingStatus
  progress: number
}

const DEFAULT_OPTIONS: TrainingQueueOptions = {
  maxTraining: 2
}

const DEFAULT_STATUS: TrainStatus = { status: 'idle', progress: 0 }

const _toKey = (id: TrainingId) => {
  const { botId, language } = id
  return `training:${botId}:${language}`
}

const _fromKey = (key: string) => {
  const [_, botId, language] = key.split(':')
  return { botId, language }
}

class TrainingContainer {
  private _trainings: { [key: string]: TrainStatus } = {}

  public has(id: TrainingId): boolean {
    return !!this.get(id)
  }

  public get(id: TrainingId): TrainStatus | undefined {
    const training = this._trainings[_toKey(id)]
    return { ...training }
  }

  public set(id: TrainingId, status: TrainStatus) {
    this._trainings[_toKey(id)] = { ...status }
  }

  public clear() {
    for (const key of Object.keys(this._trainings)) {
      delete this._trainings[key]
    }
  }

  public query(query: { status: NLU.TrainingStatus }): TrainingId[] {
    const keep = ([key, t]: [string, TrainStatus]) => t.status === query.status
    const keys = Object.entries(this._trainings)
      .filter(keep)
      .map(p => p[0])
    return keys.map(_fromKey)
  }

  public getAll() {
    return Object.entries(this._trainings).map(([k, v]) => ({
      trainId: _fromKey(k),
      status: v
    }))
  }
}

export class InMemoryTrainingQueue implements TrainingQueue {
  private _trainings = new TrainingContainer()
  private _options: TrainingQueueOptions

  constructor(
    private _errors: typeof NLU.errors,
    private _logger: sdk.Logger,
    private _trainerService: TrainerService,
    private _onChange: TrainSessionListener,
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

  async getTraining(trainId: TrainingId): Promise<NLU.TrainingSession> {
    const status = this._trainings.get(trainId) ?? DEFAULT_STATUS
    return this._toTrainSession(trainId, status)
  }

  async getAllTrainings(): Promise<NLU.TrainingSession[]> {
    return this._trainings.getAll().map(({ trainId, status }) => this._toTrainSession(trainId, status))
  }

  private _update = (id: TrainingId, training: Partial<TrainStatus>) => {
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

  private _notify = async (id: TrainingId, status: TrainStatus) => {
    const { botId } = id
    const ts = this._toTrainSession(id, status)
    return this._onChange(botId, ts)
  }

  private _toTrainSession = (id: TrainingId, training: TrainStatus): NLU.TrainingSession => {
    const key = _toKey(id)
    const { language } = id
    const { progress, status } = training
    return { key, language, progress: progress ?? 0, status }
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
      await trainer.train(language, async (progress: number) => {
        await this._update(trainId, { progress })
      })
      await this._update(trainId, { status: 'done', progress: 1 })
      await trainer.loadLatest(language)
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

    this._notify(trainId, { status: 'errored', progress: 0 })
    this._trainings.set(trainId, { status: 'needs-training', progress: 0 })
  }
}
