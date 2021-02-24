import { TrainingState, TrainingId, TrainingSession, LockedTrainingSession } from '../../typings'
import { ITrainingRepository } from '../../training-repo'

export class FakeTrainingRepository implements ITrainingRepository {
  private _trainings: { [key: string]: TrainingState & { modifiedOn: Date } } = {}

  async initialize(): Promise<void> {}

  public async has(id: TrainingId): Promise<boolean> {
    return !!this.get(id)
  }

  public async get(id: TrainingId): Promise<LockedTrainingSession | undefined> {
    const training = this._trainings[this._toKey(id)]
    return { ...id, ...training }
  }

  public async set(id: TrainingId, state: TrainingState) {
    this._trainings[this._toKey(id)] = { ...state, modifiedOn: new Date() }
  }

  public async clear() {
    const keys = Object.keys(this._trainings)
    return Promise.map(keys, async k => {
      delete this._trainings[k]
    })
  }

  public async query(query: Partial<TrainingSession>): Promise<LockedTrainingSession[]> {
    const toSession = ([key, state]: [string, TrainingState & { modifiedOn: Date }]): LockedTrainingSession => {
      const id = this._fromKey(key)
      return { ...id, ...state }
    }

    return Object.entries(this._trainings)
      .map(toSession)
      .filter(this._matchQuery(query))
  }

  public async getAll(): Promise<TrainingSession[]> {
    return Object.entries(this._trainings).map(([k, v]) => ({
      ...this._fromKey(k),
      ...v
    }))
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
