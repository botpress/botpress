import * as sdk from 'botpress/sdk'
import ms from 'ms'
import {
  TrainingState,
  TrainingId,
  TrainingSession,
  TrainingRepository,
  ReadonlyTrainingRepository,
  I
} from './typings'

export type TrainingTransaction<T> = (repo: TrainingRepository) => Promise<T>

interface TransactionHandle<T> {
  run: TrainingTransaction<T>
  cb?: (x: T) => void
}

export type IConcurentTrainingRepository = I<ConcurentTrainingRepository>

export interface ConcurentTrainingRepositoryOptions {
  jobInterval: number
}

const MAX_TRX_TIME = ms('10s')
const TRAINING_QUEUE_RESSOURCE = 'TRAINING_QUEUE_RESSOURCE'
const JOB_INTERVAL = ms('1s')

class TransactionTimeoutError extends Error {}

export class ConcurentTrainingRepository implements ReadonlyTrainingRepository {
  private _queuedTransactions: TransactionHandle<any>[] = []

  private _taskHandle: NodeJS.Timeout

  constructor(
    private _trainingRepo: TrainingRepository,
    private _distributed: typeof sdk.distributed,
    private _logger: sdk.Logger,
    private _config: Partial<ConcurentTrainingRepositoryOptions> = {}
  ) {}

  public async initialize(): Promise<void | void[]> {
    await this._trainingRepo.initialize()
    this._taskHandle = setInterval(this._runTask, this._config.jobInterval ?? JOB_INTERVAL)
  }

  public async teardown(): Promise<void> {
    clearInterval(this._taskHandle)
  }

  public has(id: TrainingId): Promise<boolean> {
    return this._trainingRepo.has(id)
  }

  public get(id: TrainingId): Promise<TrainingState | undefined> {
    return this._trainingRepo.get(id)
  }

  public query(query: Partial<TrainingSession>): Promise<TrainingSession[]> {
    return this._trainingRepo.query(query)
  }

  public getAll(): Promise<TrainingSession[]> {
    return this._trainingRepo.getAll()
  }

  public clear(): Promise<void | void[]> {
    return this._trainingRepo.clear()
  }

  public queueAndWaitTransaction = <T>(run: TrainingTransaction<T>) => {
    return new Promise<T>(resolve => {
      this._queueTransaction({
        run,
        cb: resolve
      })
    })
  }

  public queueTransaction = <T>(run: TrainingTransaction<T>) => {
    this._queueTransaction({
      run
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
