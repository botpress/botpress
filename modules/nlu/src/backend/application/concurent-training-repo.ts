import {
  TrainingState,
  TrainingId,
  TrainingSession,
  TrainingRepository,
  ReadonlyTrainingRepository,
  I
} from './typings'

export type TrainingTransaction<T> = (repo: TrainingRepository) => Promise<T>

type TransactionCallback<T> = (x: T) => void
interface TransactionHandle<T> {
  maxTime: number
  run: TrainingTransaction<T>
  cb?: TransactionCallback<T>
}

export type IConcurentTrainingRepository = I<ConcurentTrainingRepository>

export class ConcurentTrainingRepository implements ReadonlyTrainingRepository {
  private _queuedTransactions: TransactionHandle<any>[] = []
  private _curentTransaction: TransactionHandle<any> | undefined

  constructor(private _trainingRepo: TrainingRepository) {}

  public initialize(): Promise<void> {
    return this._trainingRepo.initialize()
  }

  public has(id: TrainingId): Promise<boolean> {
    return this._trainingRepo.has(id)
  }

  public get(id: TrainingId): Promise<TrainingState | undefined> {
    return this._trainingRepo.get(id)
  }

  public query(query: Partial<TrainingState>): Promise<TrainingId[]> {
    return this._trainingRepo.query(query)
  }

  public getAll(): Promise<TrainingSession[]> {
    return this._trainingRepo.getAll()
  }

  public clear(): Promise<void> {
    return this._trainingRepo.clear()
  }

  public queueAndWaitTransaction = <T>(run: TrainingTransaction<T>, maxTime: number) => {
    return new Promise<T>(resolve => {
      this._queueTransaction({
        maxTime,
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
    while (this._curentTransaction) {
      await this._sleep(this._curentTransaction.maxTime / 100)
    }

    this._curentTransaction = next

    let res: T | null = null
    try {
      res = await Promise.race([next.run(this._trainingRepo), this._sleep(next.maxTime)])
      if (res === null) {
        throw new Error(`Training transaction could not finish under ${next.maxTime} ms.`)
      }
    } finally {
      this._curentTransaction = undefined
    }

    return res
  }

  private _sleep = async (ms: number): Promise<null> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(null), ms)
    })
  }
}
