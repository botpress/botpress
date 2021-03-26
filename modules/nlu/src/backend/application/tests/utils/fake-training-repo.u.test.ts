import { TrainingState, TrainingId, TrainingSession } from '../../typings'
import { ITrainingRepository, ITrainingTransactionContext } from '../../training-repo'
import { Semaphore } from './utils.u.test'
class FakeTransactionContext implements ITrainingTransactionContext {
  public transaction = null
  private _trainings: { [key: string]: TrainingState & { modifiedOn: Date } } = {}

  public set(trainId: TrainingId, trainState: TrainingState): Promise<void> {
    this._trainings[this._toKey(trainId)] = { ...trainState, modifiedOn: new Date() }
    return
  }

  public has(trainId: TrainingId): Promise<boolean> {
    return new Promise(resolve => resolve(!!this.get(trainId)))
  }

  public get(trainId: TrainingId): Promise<TrainingSession | undefined> {
    const training = this._trainings[this._toKey(trainId)]
    if (!training) {
      return
    }
    const value = { ...trainId, ...training }
    return new Promise(resolve => resolve(value))
  }

  public async getAll(): Promise<TrainingSession[]> {
    return Object.entries(this._trainings).map(([k, v]) => ({
      ...this._fromKey(k),
      ...v
    }))
  }

  public async query(query: Partial<TrainingSession>): Promise<TrainingSession[]> {
    const toSession = ([key, state]: [string, TrainingState & { modifiedOn: Date }]): TrainingSession => {
      const id = this._fromKey(key)
      return { ...id, ...state }
    }

    return Object.entries(this._trainings)
      .map(toSession)
      .filter(this._matchQuery(query))
  }

  public async delete(id: TrainingId) {
    delete this._trainings[this._toKey(id)]
  }

  public async clear() {
    const keys = Object.keys(this._trainings)
    return Promise.map(keys, async k => {
      delete this._trainings[k]
    })
  }

  private _toKey = (id: TrainingId) => {
    const { botId, language } = id
    return `training:${botId}:${language}`
  }

  private _fromKey = (key: string) => {
    const [_, botId, language] = key.split(':')
    return { botId, language }
  }

  private _matchQuery = (query: Partial<TrainingSession>) => (ts: TrainingSession) => {
    return !Object.keys(query).some(k => query[k] !== ts[k])
  }
}

export class FakeTrainingRepository implements ITrainingRepository {
  private _context = new FakeTransactionContext()
  static semaphore = new Semaphore(1)

  async initialize(): Promise<void> {}

  public async inTransaction(action: (trx: ITrainingTransactionContext) => Promise<any>, name?: string): Promise<any> {
    return FakeTrainingRepository.semaphore.exclusively(() => {
      return action(this._context)
    })
  }

  public get = async (trainId: TrainingId): Promise<TrainingSession | undefined> => {
    return this._context.get(trainId)
  }

  public getAll = async (): Promise<TrainingSession[]> => {
    return this._context.getAll()
  }

  public has = async (trainId: TrainingId): Promise<boolean> => {
    return this._context.has(trainId)
  }

  public query = async (query: Partial<TrainingSession>): Promise<TrainingSession[]> => {
    return this._context.query(query)
  }

  public clear = async (): Promise<void[]> => {
    return this._context.clear()
  }

  public teardown = async (): Promise<void[]> => {
    return this.clear()
  }
}
