import { NLU } from 'botpress/sdk'
import { TrainingState, TrainingId, TrainingSession, TrainingRepository } from './typings'

export class InMemoryTrainingRepository implements TrainingRepository {
  private _trainings: { [key: string]: TrainingState } = {}

  async initialize(): Promise<void> {}

  public async has(id: TrainingId): Promise<boolean> {
    return !!this.get(id)
  }

  public async get(id: TrainingId): Promise<TrainingState | undefined> {
    const training = this._trainings[this._toKey(id)]
    return { ...training }
  }

  public async set(id: TrainingId, state: TrainingState) {
    this._trainings[this._toKey(id)] = { ...state }
  }

  public async clear() {
    for (const key of Object.keys(this._trainings)) {
      delete this._trainings[key]
    }
  }

  public async query(query: { status: NLU.TrainingStatus }): Promise<TrainingId[]> {
    const keep = ([key, t]: [string, TrainingState]) => t.status === query.status
    const keys = Object.entries(this._trainings)
      .filter(keep)
      .map(p => p[0])
    return keys.map(this._fromKey)
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
}
