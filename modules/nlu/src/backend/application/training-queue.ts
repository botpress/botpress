import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import moment from 'moment'
import ms from 'ms'
import nanoid from 'nanoid'
import { TrainingCanceledError, TrainingAlreadyStartedError } from '../stan/errors'
import { ITrainingRepository, ITrainingTransactionContext } from './training-repo'
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
const MAX_TRAINING_UPDATE_TIMEOUT = ms('5m')

const STATES_REQUIRING_NODE_AFFINITY: sdk.NLU.TrainingStatus[] = ['training', 'canceled', 'errored']

export class TrainingQueue {
  private _options: TrainingQueueOptions
  private _paused: boolean = true

  private _workerId = nanoid() // TODO: find a way to make this stay between server restart

  constructor(
    private _trainingRepo: ITrainingRepository,
    private _logger: sdk.Logger,
    private _trainerService: TrainerService,
    private _onChange: TrainingListener,
    options: Partial<TrainingQueueOptions> = {}
  ) {
    this._options = { ...DEFAULT_OPTIONS, ...options }
  }

  public async initialize() {
    return this._trainingRepo.initialize()
  }

  public get repository() {
    return this._trainingRepo
  }

  public async needsTraining(trainId: TrainingId): Promise<void> {
    return this._trainingRepo.inTransaction(async ctx => {
      const currentTraining = await ctx.get(trainId)
      if (currentTraining?.status === 'training') {
        return // do not notify socket if currently training
      }
      const newState = this._fillSate({ status: 'needs-training' })
      await ctx.set(trainId, newState)
      return this._notify(trainId, newState)
    }, 'needsTraining')
  }

  public queueTraining = async (trainId: TrainingId): Promise<void> => {
    await this._trainingRepo.inTransaction(async ctx => {
      const currentTraining = await ctx.get(trainId)
      if (!currentTraining) {
        const newState = this._fillSate({ status: 'training-pending' })
        await ctx.set(trainId, newState)
        await this._notify(trainId, newState)
        return
      }

      const isAlive = isTrainingAlive(currentTraining, MAX_TRAINING_UPDATE_TIMEOUT)

      if (currentTraining.status === 'training-pending') {
        debug(`Training ${this._toString(trainId)} already queued`)
        return
      } else if (currentTraining.status === 'training' && isAlive) {
        debug(`Training ${this._toString(trainId)} already started`)
        return
      } else if (currentTraining.status === 'training' && !isAlive) {
        // occurs when app killed during training and rebooted
        this._logger.warn(`Training ${this._toString(trainId)} seems to be a zombie`)
      }

      const newState = this._fillSate({ status: 'training-pending' })
      await ctx.set(trainId, newState)
      await this._notify(trainId, newState)
    }, 'queueTraining')

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
    return this._trainingRepo.inTransaction(async ctx => {
      const { botId, language } = trainId

      const currentTraining = await ctx.get(trainId)
      if (!currentTraining) {
        return
      }

      if (currentTraining.status === 'training-pending') {
        const newState = this._fillSate({ status: 'needs-training' })
        await this._notify(trainId, newState)
        return ctx.set(trainId, newState)
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
        await ctx.set(trainId, newState)
        return this._notify(trainId, newState)
      }

      debug(`No training canceled as ${botId} is not currently training language ${language}.`)
    }, 'cancelTraining')
  }

  protected async loadModel(trainId: TrainingId, modelId: string): Promise<void> {
    const { language, botId } = trainId
    const trainer = this._trainerService.getBot(botId)
    if (trainer) {
      return trainer.setModel(language, modelId)
    }
  }

  public async getTraining(trainId: TrainingId): Promise<TrainingState> {
    const state = await this._trainingRepo.get(trainId)
    return state ?? this._fillSate(DEFAULT_STATE)
  }

  public async cancelTrainings(botId: string): Promise<void[]> {
    const allTrainings = await this._trainingRepo.getAll()
    const currentTrainings = allTrainings.filter(ts => ts.botId === botId)
    return Promise.mapSeries(currentTrainings, t => this.cancelTraining(t))
  }

  private _update = async (id: TrainingId, newState: TrainingState, context: ITrainingTransactionContext) => {
    await context.set(id, newState)
    return this._notify(id, newState)
  }

  private _notify = (trainId: TrainingId, state: TrainingState) => {
    return this._onChange({ ...trainId, ...state })
  }

  protected async runTask(): Promise<void> {
    return this._trainingRepo.inTransaction(async ctx => {
      const localTrainings = await ctx.query({ owner: this._workerId, status: 'training' })
      if (localTrainings.length >= this._options.maxTraining) {
        return
      }

      const pendings = await ctx.query({ status: 'training-pending' })
      const mountedPendings = pendings.filter(t => this._trainerService.hasBot(t.botId))
      if (mountedPendings.length <= 0) {
        return
      }

      const { botId, language } = pendings[0]
      const trainId = { botId, language }

      const newState = this._fillSate({ status: 'training' })
      await ctx.set(trainId, newState) // wait for the first progress update to notify socket

      debug(`training ${this._toString(trainId)} is about to start.`)
      // floating promise to return fast from task
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this._train(trainId)
    }, 'runTask')
  }

  private _train = async (trainId: TrainingId) => {
    const { botId, language } = trainId
    const trainer = this._trainerService.getBot(botId)
    if (!trainer) {
      // This case should never happend
      return this._trainingRepo.inTransaction(trx => {
        this._logger.warn(`About to train ${botId}, but no bot found.`)
        const newState = this._fillSate({ status: 'needs-training' })
        return this._update(trainId, newState, trx)
      }, '_train')
    }

    try {
      const modelId = await trainer.train(language, async (progress: number) => {
        return this._trainingRepo.inTransaction(trx => {
          const newState = this._fillSate({ status: 'training', progress })
          return this._update(trainId, newState, trx)
        }, 'train: update progress')
      })

      await this.loadModel(trainId, modelId)

      await this._trainingRepo.inTransaction(async trx => {
        const newState = this._fillSate({ status: 'done', progress: 1 })
        await this._update(trainId, newState, trx)
      }, 'train: set to done')
    } catch (err) {
      await this._handleTrainError(trainId, err)
    } finally {
      await this.runTask()
    }
  }

  private _handleTrainError = async (trainId: TrainingId, err: Error) => {
    const { botId } = trainId

    if (err instanceof TrainingCanceledError) {
      return this._trainingRepo.inTransaction(async trx => {
        this._logger.forBot(botId).info(`Training ${this._toString(trainId)} canceled`)
        const newState = this._fillSate({ status: 'needs-training' })
        return this._update(trainId, newState, trx)
      }, '_handleTrainError: canceled')
    }

    if (err instanceof TrainingAlreadyStartedError) {
      // This should not happend
      this._logger.forBot(botId).warn(`Training ${this._toString(trainId)} already started`)
      return
    }

    return this._trainingRepo.inTransaction(async trx => {
      this._logger
        .forBot(botId)
        .attachError(err)
        .error(`Training ${this._toString(trainId)} could not finish because of an unexpected error.`)

      await this._notify(trainId, this._fillSate({ status: 'errored' }))

      return trx.set(trainId, this._fillSate({ status: 'needs-training' }))
    }, '_handleTrainError: unexpected error')
  }

  private _toString(id: TrainingId) {
    const { botId, language } = id
    return JSON.stringify({ botId, language })
  }

  private _fillSate(state: { status: sdk.NLU.TrainingStatus; progress?: number }): TrainingState {
    const { status, progress } = state
    const requiresOwner = STATES_REQUIRING_NODE_AFFINITY.includes(status)
    const owner = requiresOwner ? this._workerId : null
    const modifiedOn = new Date()
    return { status, owner, modifiedOn, progress: progress ?? 0 }
  }

  public teardown = async (): Promise<void[]> => {
    return this._trainingRepo.teardown()
  }
}

const isTrainingAlive = (training: TrainingSession, ms: number) => {
  const now = moment()
  const timeOfDeath = moment(now.clone()).subtract(ms, 'ms')

  const { modifiedOn } = training
  const lastlyUpdated = moment(modifiedOn)
  return !lastlyUpdated.isBefore(timeOfDeath)
}
