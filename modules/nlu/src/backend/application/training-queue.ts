import * as sdk from 'botpress/sdk'

import _ from 'lodash'

import ms from 'ms'
import nanoid from 'nanoid'
import { ITrainingService } from './training-service'
import { TrainingId, TrainerService, TrainingListener, TrainingState, TrainingSession, I } from './typings'

export interface TrainingQueueOptions {
  maxTraining: number
}

const DEFAULT_OPTIONS: TrainingQueueOptions = {
  maxTraining: 2
}

const DEFAULT_STATE = { status: <sdk.NLU.TrainingStatus>'idle', progress: 0 }

export type ITrainingQueue = I<TrainingQueue>

const debug = DEBUG('nlu').sub('lifecycle')

const TRAINING_LIFE_TIME = ms('5m')

export class TrainingQueue {
  private _options: TrainingQueueOptions
  private _paused: boolean = true

  private _workerId = nanoid() // TODO: find a way to make this stay between server restart

  constructor(
    private _trainingService: ITrainingService,
    private _errors: typeof sdk.NLU.errors,
    private _logger: sdk.Logger,
    private _trainerService: TrainerService,
    private _onChange: TrainingListener,
    options: Partial<TrainingQueueOptions> = {}
  ) {
    this._options = { ...DEFAULT_OPTIONS, ...options }
  }

  public async initialize() {
    return this._trainingService.initialize()
  }

  public get service(): ITrainingService {
    return this._trainingService
  }

  public async teardown() {
    await this._trainingService.clear()
    return this._trainingService.teardown()
  }

  public async needsTraining(trainId: TrainingId): Promise<void> {
    return this._trainingService.transaction(async repo => {
      const currentTraining = await repo.get(trainId)
      if (currentTraining?.status === 'training') {
        return // do not notify socket if currently training
      }

      const newState = this._fillSate({ status: 'needs-training' })
      await this._notify(trainId, newState)
      return repo.set(trainId, newState)
    })
  }

  public queueTraining = async (trainId: TrainingId): Promise<void> => {
    await this._trainingService.transaction(async repo => {
      const currentTraining = await this._trainingService.get(trainId)

      const isAlive = (training: TrainingSession) => this._trainingService.isAlive(training, TRAINING_LIFE_TIME)

      if (currentTraining?.status === 'training-pending') {
        debug(`Training ${this._toString(trainId)} already queued`)
        return
      } else if (currentTraining?.status === 'training' && isAlive(currentTraining)) {
        debug(`Training ${this._toString(trainId)} already started`)
        return
      } else if (currentTraining?.status === 'training' && !isAlive(currentTraining)) {
        // occurs when app killed during training and rebooted
        this._logger.warn(`Training ${this._toString(trainId)} seems to be a zombie`)
      }

      const newState = this._fillSate({ status: 'training-pending' })
      await this._notify(trainId, newState)
      return repo.set(trainId, newState)
    })

    if (this._paused) {
      return
    }

    return this.runTask()
  }

  public pause() {
    this._paused = true
  }

  public async resume() {
    this._paused = false
    await this.runTask()
  }

  public async cancelTraining(trainId: TrainingId): Promise<void> {
    return this._trainingService.transaction(async repo => {
      const { botId, language } = trainId

      const currentTraining = await this._trainingService.get(trainId)
      if (!currentTraining) {
        return
      }

      if (currentTraining.status === 'training-pending') {
        const newState = this._fillSate({ status: 'needs-training' })
        await this._notify(trainId, newState)
        return repo.set(trainId, newState)
      }

      if (currentTraining.status === 'training') {
        await this._notify(trainId, this._fillSate({ status: 'canceled' }))

        const trainer = this._trainerService.getBot(botId)
        if (trainer) {
          await trainer.cancelTraining(language)
        } else {
          // This case should never happend
          this._logger.warn(`About to cancel training for ${botId}, but no bot found.`)
        }

        const newState = this._fillSate({ status: 'needs-training' })
        await this._notify(trainId, newState)
        return repo.set(trainId, newState)
      }

      debug(`No training canceled as ${botId} is not currently training language ${language}.`)
    })
  }

  protected async loadModel(botId: string, modelId: sdk.NLU.ModelId): Promise<void> {
    const trainer = this._trainerService.getBot(botId)
    if (trainer) {
      return trainer.load(modelId)
    }
  }

  public async getTraining(trainId: TrainingId): Promise<TrainingState> {
    const state = await this._trainingService.get(trainId)
    return state ?? this._fillSate(DEFAULT_STATE)
  }

  public async cancelTrainings(botId: string): Promise<void[]> {
    const allTrainings = await this._trainingService.getAll()
    const currentTrainings = allTrainings.filter(ts => ts.botId === botId)
    return Promise.mapSeries(currentTrainings, t => this.cancelTraining(t))
  }

  public async getAllTrainings(): Promise<TrainingSession[]> {
    return this._trainingService.getAll()
  }

  private _update = async (id: TrainingId, newState: TrainingState) => {
    await this._notify(id, newState)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._trainingService.transaction(async repo => {
      return repo.set(id, newState)
    })
  }

  private _notify = (trainId: TrainingId, state: TrainingState) => {
    return this._onChange({ ...trainId, ...state })
  }

  protected async runTask(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._trainingService.transaction(async repo => {
      const localTrainings = await repo.query({ owner: this._workerId, status: 'training' })
      if (localTrainings.length >= this._options.maxTraining) {
        return
      }

      const pendings = await repo.query({ status: 'training-pending' })
      const mountedPendings = pendings.filter(t => this._trainerService.hasBot(t.botId))
      if (mountedPendings.length <= 0) {
        return
      }

      const { botId, language } = pendings[0]
      const next = { botId, language }

      const newState = this._fillSate({ status: 'training' })
      await repo.set(next, newState) // wait for the first progress update to notify socket

      debug(`training ${this._toString(next)} is about to start.`)

      // floating promise to return fast from task
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this._train(next)
    })
  }

  private _train = async (trainId: TrainingId) => {
    const { botId, language } = trainId
    const trainer = this._trainerService.getBot(botId)
    if (!trainer) {
      // This case should never happend
      this._logger.warn(`About to train ${botId}, but no bot found.`)
      const newState = this._fillSate({ status: 'needs-training' })
      await this._update(trainId, newState)
      return
    }

    try {
      const modelId = await trainer.train(language, async (progress: number) => {
        const newState = this._fillSate({ status: 'training', progress })
        return this._update(trainId, newState)
      })
      await this.loadModel(botId, modelId)

      const newState = this._fillSate({ status: 'done', progress: 1 })
      await this._update(trainId, newState)
    } catch (err) {
      await this._handleTrainError(trainId, err)
    } finally {
      await this.runTask()
    }
  }

  private _handleTrainError = async (trainId: TrainingId, err: Error) => {
    const { botId } = trainId

    if (this._errors.isTrainingCanceled(err)) {
      this._logger.forBot(botId).info(`Training ${this._toString(trainId)} canceled`)
      const newState = this._fillSate({ status: 'needs-training' })
      return this._update(trainId, newState)
    }

    if (this._errors.isTrainingAlreadyStarted(err)) {
      // This should not happend
      this._logger.forBot(botId).warn(`Training ${this._toString(trainId)} already started`)
      return
    }

    this._logger
      .forBot(botId)
      .attachError(err)
      .error(`Training ${this._toString(trainId)} could not finish because of an unexpected error.`)

    await this._notify(trainId, this._fillSate({ status: 'errored' }))

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._trainingService.transaction(repo => repo.set(trainId, this._fillSate({ status: 'needs-training' })))
  }

  private _toString(id: TrainingId) {
    const { botId, language } = id
    return JSON.stringify({ botId, language })
  }

  private _fillSate(state: { status: sdk.NLU.TrainingStatus; progress?: number }): TrainingState {
    const { status, progress } = state
    const owner = this._workerId
    const modifiedOn = new Date()
    return { status, owner, modifiedOn, progress: progress ?? 0 }
  }
}
