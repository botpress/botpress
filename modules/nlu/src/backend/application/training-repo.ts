import _ from 'lodash'
import { TrainingId, TrainingSession, I, TrainingState } from './typings'

const JOIN_CHAR = '+'

export type ITrainingRepository = I<TrainingRepository>
export class TrainingRepository implements ITrainingRepository {
  private _trainings: _.Dictionary<TrainingState> = {}

  constructor() {}

  public get = (trainId: TrainingId): TrainingSession | undefined => {
    const state = this._trainings[this._formatTrainKey(trainId)]
    return state && { ...state, ...trainId }
  }

  public set = (trainId: TrainingId, state: TrainingState): void => {
    this._trainings[this._formatTrainKey(trainId)] = state
  }

  public getAll = (): TrainingSession[] => {
    const all: TrainingSession[] = []
    for (const [key, state] of Object.entries(this._trainings)) {
      const id = this._parseTrainKey(key)
      all.push({ ...id, ...state })
    }
    return all
  }

  public has = (trainId: TrainingId): boolean => {
    return !!this.get(trainId)
  }

  public query = (query: Partial<TrainingSession>): TrainingSession[] => {
    let queryResult = this.getAll()
    for (const f in query) {
      queryResult = queryResult.filter(ts => ts[f] === query[f])
    }
    return queryResult
  }

  public delete = (trainId: TrainingId) => {
    delete this._trainings[this._formatTrainKey(trainId)]
  }

  public clear = (): void => {
    this._trainings = {}
  }

  private _formatTrainKey = (trainId: TrainingId): string => {
    return `${trainId.botId}${JOIN_CHAR}${trainId.language}`
  }
  private _parseTrainKey = (key: string): TrainingId => {
    const [botId, language] = key.split(JOIN_CHAR)
    return {
      botId,
      language
    }
  }
}
