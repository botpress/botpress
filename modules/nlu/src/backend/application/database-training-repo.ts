import * as sdk from 'botpress/sdk'
import { TrainingRepository, TrainingId, TrainingState, TrainingSession } from './typings'

const TABLE_NAME = 'nlu_training_queue'

export class DatabaseTrainingRepository implements TrainingRepository {
  constructor(private _database: typeof sdk.database) {}

  initialize = async (): Promise<void> => {
    await this._database.createTableIfNotExists(TABLE_NAME, table => {
      table.string('botId').notNullable() // TODO: this should not build if we change training sessions
      table.string('language').notNullable()
      table.string('status').notNullable()
      table.float('progress').notNullable()
      table.primary(['botId', 'language'])
    })
  }

  getAll = async (): Promise<TrainingSession[]> => {
    return this._database(TABLE_NAME).select('*')
  }

  set = async (id: TrainingId, state: TrainingState): Promise<void> => {
    return this._database(TABLE_NAME)
      .where(id)
      .update({ ...state })
  }

  has = async (id: TrainingId): Promise<boolean> => {
    return !!(await this.get(id))
  }

  get = async (id: TrainingId): Promise<TrainingState | undefined> => {
    return this._database
      .from(TABLE_NAME)
      .where(id)
      .select('*')
      .first()
  }

  query = async (query: Partial<TrainingSession>): Promise<TrainingSession[]> => {
    return this._database
      .from(TABLE_NAME)
      .where(query)
      .select('*')
  }

  clear = async (): Promise<void[]> => {
    return this._database.from(TABLE_NAME).delete('*')
  }
}
