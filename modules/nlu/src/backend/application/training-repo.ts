import * as sdk from 'botpress/sdk'
import { TrainingId, TrainingState, TrainingSession, I, LockedTrainingSession } from './typings'

const TABLE_NAME = 'nlu_training_queue'

export type ITrainingRepository = I<TrainingRepository>

export class TrainingRepository implements TrainingRepository {
  constructor(private _database: typeof sdk.database) {}

  public initialize = async (): Promise<void | void[]> => {
    return void this._database.createTableIfNotExists(TABLE_NAME, table => {
      table.string('botId').notNullable()
      table.string('language').notNullable()
      table.string('status').notNullable()
      table.float('progress').notNullable()
      table.timestamp('modifiedOn').notNullable()
      table.primary(['botId', 'language'])
    })
  }

  public getAll = async (): Promise<TrainingSession[]> => {
    return this._database(TABLE_NAME).select('*')
  }

  public set = async (trainId: TrainingId, trainState: TrainingState): Promise<void> => {
    const { botId, language } = trainId
    const { progress, status } = trainState

    const modifiedOn = this._database.date.now()
    if (await this.has({ botId, language })) {
      return this._database(TABLE_NAME)
        .where({ botId, language })
        .update({ progress, status, modifiedOn })
    }
    return this._database(TABLE_NAME).insert({ botId, language, progress, status, modifiedOn })
  }

  public has = async (trainId: TrainingId): Promise<boolean> => {
    const { botId, language } = trainId
    const result = !!(await this.get({ botId, language }))
    return result
  }

  public get = async (trainId: TrainingId): Promise<LockedTrainingSession | undefined> => {
    const { botId, language } = trainId

    return this._database
      .from(TABLE_NAME)
      .where({ botId, language })
      .select('*')
      .first()
  }

  public query = async (query: Partial<TrainingSession>): Promise<LockedTrainingSession[]> => {
    return this._database
      .from(TABLE_NAME)
      .where(query)
      .select('*')
  }

  public clear = async (): Promise<void[]> => {
    return this._database.from(TABLE_NAME).delete('*')
  }
}
