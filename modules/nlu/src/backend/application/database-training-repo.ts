import * as sdk from 'botpress/sdk'
import { TrainingRepository, TrainingId, TrainingState, TrainingSession } from './typings'

const TABLE_NAME = 'nlu_training_queue'

export class DatabaseTrainingRepository implements TrainingRepository {
  constructor(private _database: typeof sdk.database) {}

  public initialize = async (): Promise<void | void[]> => {
    return void this._database.createTableIfNotExists(TABLE_NAME, table => {
      table.string('botId').notNullable() // TODO: this should not build if we change training sessions
      table.string('language').notNullable()
      table.string('status').notNullable()
      table.float('progress').notNullable()
      table.primary(['botId', 'language'])
    })
  }

  public getAll = async (): Promise<TrainingSession[]> => {
    return this._database(TABLE_NAME).select('*')
  }

  public set = async (trainId: TrainingId, trainState: TrainingState): Promise<void> => {
    const { botId, language } = trainId
    const { progress, status } = trainState

    if (await this.has({ botId, language })) {
      return this._database(TABLE_NAME)
        .where({ botId, language })
        .update({ progress, status })
    }
    return this._database(TABLE_NAME).insert({ botId, language, progress, status })
  }

  public has = async (trainId: TrainingId): Promise<boolean> => {
    const { botId, language } = trainId
    const result = !!(await this.get({ botId, language }))
    return result
  }

  public get = async (trainId: TrainingId): Promise<TrainingState | undefined> => {
    const { botId, language } = trainId

    return this._database
      .from(TABLE_NAME)
      .where({ botId, language })
      .select('*')
      .first()
  }

  public query = async (query: Partial<TrainingSession>): Promise<TrainingSession[]> => {
    return this._database
      .from(TABLE_NAME)
      .where(query)
      .select('*')
  }

  public clear = async (): Promise<void[]> => {
    return this._database.from(TABLE_NAME).delete('*')
  }
}
