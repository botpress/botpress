import * as sdk from 'botpress/sdk'

import _ from 'lodash'

import { IConcurentTrainingRepository } from './concurent-training-repo'
import { LocalTrainingContainer } from './local-training-container'
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

const debug = DEBUG('nlu').sub('lifecycle')

export class TrainingQueue implements TrainingQueue {
  private _options: TrainingQueueOptions

  private _broadcastCancelTraining: (id: TrainingId) => Promise<void>
  private _broadcastLoadModel: (botId: string, modelId: sdk.NLU.ModelId) => Promise<void>
  private _broadcastRunTask: () => Promise<void>

  private _localTrainings: LocalTrainingContainer

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
    this._localTrainings = new LocalTrainingContainer(this._distributed)
  }

  public initialize = async () => {
    const { _localCancelTraining, _localLoadModel, _localRunTask } = this

    this._broadcastCancelTraining = (await this._distributed.broadcast(
      _localCancelTraining.bind(this)
    )) as typeof _localCancelTraining

    this._broadcastLoadModel = (await this._distributed.broadcast(_localLoadModel.bind(this))) as typeof _localLoadModel

    this._broadcastRunTask = (await this._distributed.broadcast(_localRunTask.bind(this))) as typeof _localRunTask

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
    await this._trainingRepo.queueAndWaitTransaction(async repo => {
      const update = this._makeUpdater(repo)

      const currentTraining = await this._trainingRepo.get(trainId)
      const isLocked = await this._localTrainings.isLocked(trainId)
      if (currentTraining?.status === 'training' && isLocked) {
        debug(`Training ${this._toString(trainId)} already started`)
        return
      } else if (currentTraining?.status === 'training' && !isLocked) {
        // occurs when app killed during training and rebooted
        this._logger.warn(`Training ${this._toString(trainId)} seems to be a zombie`)
      }
      return update(trainId, { status: 'training-pending', progress: 0 })
    })

    return this._broadcastRunTask()
  }

  public cancelTraining = async (trainId: TrainingId): Promise<void> => {
    return this._broadcastCancelTraining(trainId)
  }

  // Do not use arrow notation as _localCancelTraining.name needs to be defined
  private async _localCancelTraining(trainId: TrainingId): Promise<void> {
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

      debug(`No training canceled as ${botId} is not currently training language ${language}.`)
    })
  }

  // Do not use arrow notation as _localLoadModel.name needs to be defined
  private async _localLoadModel(botId: string, modelId: sdk.NLU.ModelId): Promise<void> {
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

  private async _localRunTask(): Promise<void> {
    return this._trainingRepo.queueAndWaitTransaction(async repo => {
      if (this._localTrainings.length() >= this._options.maxTraining) {
        return
      }

      const pendings = await repo.query({ status: 'training-pending' })
      const mountedPendings = pendings.filter(t => this._trainerService.hasBot(t.botId))
      if (mountedPendings.length <= 0) {
        return
      }

      const next = pendings[0]
      await this._localTrainings.startLocalTraining(next)
      await repo.set(next, { status: 'training', progress: 0 }) // wait for the first progress update to notify socket

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
      await this._lockAndUpdate(trainId, { status: 'needs-training', progress: 0 })
      await this._localTrainings.rmLocalTraining(trainId)
      return
    }

    try {
      const modelId = await trainer.train(language, async (progress: number) => {
        await this._localTrainings.refreshLocalTraining(trainId)
        return this._lockAndUpdate(trainId, { status: 'training', progress })
      })
      await this._broadcastLoadModel(botId, modelId)

      await this._lockAndUpdate(trainId, { status: 'done', progress: 1 })
    } catch (err) {
      await this._handleTrainError(trainId, err)
    } finally {
      await this._localTrainings.rmLocalTraining(trainId)
      await this._broadcastRunTask()
    }
  }

  private _handleTrainError = async (trainId: TrainingId, err: Error) => {
    const { botId } = trainId

    if (this._errors.isTrainingCanceled(err)) {
      this._logger.forBot(botId).info(`Training ${this._toString(trainId)} canceled`)
      return this._lockAndUpdate(trainId, { status: 'needs-training', progress: 0 })
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

    await this._notify(trainId, { status: 'errored', progress: 0 })
    await this._trainingRepo.queueAndWaitTransaction(repo =>
      repo.set(trainId, { status: 'needs-training', progress: 0 })
    )
  }

  private _toString(id: TrainingId) {
    const { botId, language } = id
    return JSON.stringify({ botId, language })
  }
}
