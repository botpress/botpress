import { NLU } from 'botpress/sdk'
import { TrainingState, TrainingId, I, TrainingSession } from './typings'

export type ITrainingRepository = I<InMemoryTrainingRepository>

export class InMemoryTrainingRepository {
  private _trainings: { [key: string]: TrainingState } = {}

  public has(id: TrainingId): boolean {
    return !!this.get(id)
  }

  public get(id: TrainingId): TrainingState | undefined {
    const training = this._trainings[this._toKey(id)]
    return { ...training }
  }

  public set(id: TrainingId, state: TrainingState) {
    this._trainings[this._toKey(id)] = { ...state }
  }

  public clear() {
    for (const key of Object.keys(this._trainings)) {
      delete this._trainings[key]
    }
  }

  public query(query: { status: NLU.TrainingStatus }): TrainingId[] {
    const keep = ([key, t]: [string, TrainingState]) => t.status === query.status
    const keys = Object.entries(this._trainings)
      .filter(keep)
      .map(p => p[0])
    return keys.map(this._fromKey)
  }

  public getAll(): TrainingSession[] {
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
