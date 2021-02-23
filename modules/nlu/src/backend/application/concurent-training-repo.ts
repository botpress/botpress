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

const MAX_TRX_TIME = ms('10s')
const TRAINING_QUEUE_RESSOURCE = 'TRAINING_QUEUE_RESSOURCE' // TODO: have a global ressource + a ressource per trainingId

export class ConcurentTrainingRepository implements ReadonlyTrainingRepository {
  private _queuedTransactions: TransactionHandle<any>[] = []

  constructor(
    private _trainingRepo: TrainingRepository,
    private _distributed: typeof sdk.distributed,
    private _logger: sdk.Logger
  ) {}

  public initialize(): Promise<void | void[]> {
    return this._trainingRepo.initialize()
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

  private _queueTransaction = <T>(trx: TransactionHandle<T>) => {
    this._queuedTransactions.unshift(trx)

    // no need to await usage of callback function instead
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._runNextTransaction()
  }

  private _runNextTransaction = async () => {
    const next = this._queuedTransactions.pop()
    if (!next) {
      return
    }

    const res = await this._runTransaction(next)
    next.cb?.(res)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._runNextTransaction()
  }

  private _runTransaction = async <T>(next: TransactionHandle<T>) => {
    let lock = await this._distributed.acquireLock(TRAINING_QUEUE_RESSOURCE, MAX_TRX_TIME)
    while (!lock) {
      await this._sleep(MAX_TRX_TIME / 100)
      lock = await this._distributed.acquireLock(TRAINING_QUEUE_RESSOURCE, MAX_TRX_TIME)
    }

    let res: T | null = null
    try {
      res = await Promise.race([next.run(this._trainingRepo), this._sleep(MAX_TRX_TIME)])
      if (res === null) {
        this._logger.error(`Training transaction could not finish under ${MAX_TRX_TIME} ms.`)
      }
    } finally {
      lock.unlock()
    }

    return res
  }

  private _sleep = async (ms: number): Promise<null> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(null), ms)
    })
  }
}
