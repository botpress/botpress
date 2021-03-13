import * as sdk from 'botpress/sdk'
import moment from 'moment'
import ms from 'ms'
import { ITrainingRepository } from './training-repo'
import { TrainingId, TrainingSession, I } from './typings'

export type TrainingTransaction<T> = (repo: ITrainingRepository) => Promise<T>

interface TransactionHandle<T> {
  run: TrainingTransaction<T>
  cb?: (x: T) => void
}

export interface TrainingServiceOptions {
  jobInterval: number
}

const MAX_TRX_TIME = ms('10s')
const TRAINING_QUEUE_RESSOURCE = 'TRAINING_QUEUE_RESSOURCE'
const JOB_INTERVAL = ms('1s')

class TransactionTimeoutError extends Error {}

export type ITrainingService = I<TrainingService>

export class TrainingService {
  private _queuedTransactions: TransactionHandle<any>[] = []

  private _taskHandle: NodeJS.Timeout

  constructor(
    private _trainingRepo: ITrainingRepository,
    private _distributed: typeof sdk.distributed,
    private _logger: sdk.Logger,
    private _config: Partial<TrainingServiceOptions> = {}
  ) {}

  public async initialize(): Promise<void | void[]> {
    await this._trainingRepo.initialize()
    this._taskHandle = setInterval(this._runTask, this._config.jobInterval ?? JOB_INTERVAL)
  }

  public get repository(): ITrainingRepository {
    return this._trainingRepo
  }

  public async teardown(): Promise<void> {
    clearInterval(this._taskHandle)
  }

  public has(id: TrainingId): Promise<boolean> {
    return this._trainingRepo.has(id)
  }

  public get(id: TrainingId) {
    return this._trainingRepo.get(id)
  }

  public query(query: Partial<TrainingSession>) {
    return this._trainingRepo.query(query)
  }

  public getAll(): Promise<TrainingSession[]> {
    return this._trainingRepo.getAll()
  }

  public clear(): Promise<void | void[]> {
    return this._trainingRepo.clear()
  }

  public isAlive(training: TrainingSession, ms: number) {
    const now = moment()
    const timeOfDeath = moment(now.clone()).subtract(ms, 'ms')

    const { modifiedOn } = training
    const lastlyUpdated = moment(modifiedOn)
    return !lastlyUpdated.isBefore(timeOfDeath)
  }

  public transaction = <T>(run: TrainingTransaction<T>) => {
    return new Promise<T>(resolve => {
      this._queueTransaction({
        run,
        cb: resolve
      })
    })
  }

  private _queueTransaction = <T>(trx: TransactionHandle<T>) => {
    this._queuedTransactions.unshift(trx)

    // no need to await usage of callback function instead
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._runTask()
  }

  private _runTask = async () => {
    if (!this._queuedTransactions.length) {
      return
    }

    const lock = await this._distributed.acquireLock(TRAINING_QUEUE_RESSOURCE, MAX_TRX_TIME)
    if (!lock) {
      return
    }

    try {
      while (this._queuedTransactions.length) {
        const next = this._queuedTransactions.pop()!
        await this._runTransaction(next)
      }
    } finally {
      await lock.unlock()
    }
  }

  private _runTransaction = async <T>(next: TransactionHandle<T>) => {
    try {
      const timeout = this._makeTimeout(MAX_TRX_TIME)
      const res = await Promise.race([next.run(this._trainingRepo), timeout])
      next.cb?.(res!)
    } catch (err) {
      if (err instanceof TransactionTimeoutError) {
        this._logger.error(`Training transaction could not complete under ${MAX_TRX_TIME} ms.`)
        return
      }
      throw err
    }
  }

  private _makeTimeout = async (ms: number): Promise<undefined> => {
    return new Promise((_resolve, reject) => {
      setTimeout(() => reject(new TransactionTimeoutError()), ms)
    })
  }
}
