import * as sdk from 'botpress/sdk'

import _ from 'lodash'
import ms from 'ms'
import { IConcurentTrainingRepository } from './concurent-training-repo'
import {
  TrainingId,
  TrainerService,
  TrainingListener,
  TrainingState,
  TrainingSession,
  I,
  TrainingRepository
} from './typings'

export interface TrainingQueueOptions {
  maxTraining: number
}

const DEFAULT_OPTIONS: TrainingQueueOptions = {
  maxTraining: 2
}

const DEFAULT_STATUS: TrainingState = { status: 'idle', progress: 0 }

export type ITrainingQueue = I<TrainingQueue>

export class TrainingQueue implements TrainingQueue {
  private _options: TrainingQueueOptions

  private _broadcastCancelTraining: (id: TrainingId) => Promise<void>
  private _broadcastLoadModel: (botId: string, modelId: sdk.NLU.ModelId) => Promise<void>

  constructor(
    private _trainingRepo: IConcurentTrainingRepository,
    private _errors: typeof sdk.NLU.errors,
    private _logger: sdk.Logger,
    private _trainerService: TrainerService,
    private _distributed: typeof sdk.distributed,
    private _onChange: TrainingListener,
    options: Partial<TrainingQueueOptions> = {}
  ) {
    this._options = { ...DEFAULT_OPTIONS, ...options }
  }

  public initialize = async () => {
    const { _localCancelTraining, _localLoadModel } = this

    this._broadcastCancelTraining = (await this._distributed.broadcast(
      _localCancelTraining
    )) as typeof _localCancelTraining

    this._broadcastLoadModel = (await this._distributed.broadcast(_localLoadModel)) as typeof _localLoadModel

    return this._trainingRepo.initialize()
  }

  public teardown = async () => {
    return this._trainingRepo.clear()
  }

  public needsTraining = async (trainId: TrainingId): Promise<void> => {
    return this._trainingRepo.queueAndWaitTransaction(async repo => {
      const update = this._makeUpdater(repo)

      const currentTraining = await repo.get(trainId)
      if (currentTraining?.status === 'training') {
        return // do not notify socket if currently training
      }
      return update(trainId, { status: 'needs-training', progress: 0 })
    })
  }

  public queueTraining = async (trainId: TrainingId): Promise<void> => {
    return this._trainingRepo.queueAndWaitTransaction(async repo => {
      const update = this._makeUpdater(repo)

      const currentTraining = await this._trainingRepo.get(trainId)
      if (currentTraining?.status === 'training') {
        this._logger.warn('Training already started')
        return // do not queue training if currently training
      }
      await update(trainId, { status: 'training-pending', progress: 0 })

      return this._runTask(repo)
    })
  }

  public cancelTraining = async (trainId: TrainingId): Promise<void> => {
    return this._broadcastCancelTraining(trainId)
  }

  private _localCancelTraining = async (trainId: TrainingId): Promise<void> => {
    return this._trainingRepo.queueAndWaitTransaction(async repo => {
      const { botId, language } = trainId

      const update = this._makeUpdater(repo)

      const currentTraining = await this._trainingRepo.get(trainId)
      if (!currentTraining) {
        return
      }

      if (currentTraining.status === 'training-pending') {
        return update(trainId, { status: 'needs-training', progress: 0 })
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

        return update(trainId, { status: 'needs-training', progress: 0 })
      }

      this._logger.warn(`No training canceled as ${botId} is not currently training language ${language}.`)
    })
  }

  private _localLoadModel = async (botId: string, modelId: sdk.NLU.ModelId): Promise<void> => {
    const trainer = this._trainerService.getBot(botId)
    if (trainer) {
      return trainer.load(modelId)
    }
  }

  public getTraining = async (trainId: TrainingId): Promise<TrainingState> => {
    const state = await this._trainingRepo.get(trainId)
    return state ?? DEFAULT_STATUS
  }

  public cancelTrainings = async (botId: string): Promise<void[]> => {
    const allTrainings = await this._trainingRepo.getAll()
    const currentTrainings = allTrainings.filter(ts => ts.botId === botId)
    return Promise.mapSeries(currentTrainings, t => this.cancelTraining(t))
  }

  public getAllTrainings = async (): Promise<TrainingSession[]> => {
    return this._trainingRepo.getAll()
  }

  private _makeUpdater = (repo: TrainingRepository) => async (id: TrainingId, newState: TrainingState) => {
    await this._notify(id, newState)
    return repo.set(id, newState)
  }

  private _lockAndUpdate = async (id: TrainingId, newState: TrainingState) => {
    await this._notify(id, newState)
    return this._trainingRepo.queueAndWaitTransaction(async repo => {
      return repo.set(id, newState)
    })
  }

  private _notify = (trainId: TrainingId, state: TrainingState) => {
    return this._onChange({ ...trainId, ...state })
  }

  private _runTask = async (repo: TrainingRepository) => {
    const queryResult = await repo.query({ status: 'training' })
    if (queryResult.length >= this._options.maxTraining) {
      return
    }

    const pendings = await repo.query({ status: 'training-pending' })
    if (pendings.length <= 0) {
      return
    }

    const next = pendings[0]
    await repo.set(next, { status: 'training', progress: 0 }) // wait for the first progress update to notify socket

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
      return this._lockAndUpdate(trainId, { status: 'needs-training', progress: 0 })
    }

    try {
      const modelId = await trainer.train(language, (progress: number) => {
        return this._lockAndUpdate(trainId, { status: 'training', progress })
      })
      await this._broadcastLoadModel(botId, modelId)
      await this._lockAndUpdate(trainId, { status: 'done', progress: 1 })
    } catch (err) {
      await this._handleTrainError(trainId, err)
    } finally {
      return this._trainingRepo.queueAndWaitTransaction(this._runTask)
    }
  }

  private _handleTrainError = async (trainId: TrainingId, err: Error) => {
    const { botId } = trainId

    if (this._errors.isTrainingCanceled(err)) {
      this._logger.forBot(botId).info('Training cancelled')
      return this._lockAndUpdate(trainId, { status: 'needs-training', progress: 0 })
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
    await this._trainingRepo.queueAndWaitTransaction(repo =>
      repo.set(trainId, { status: 'needs-training', progress: 0 })
    )
  }
}
