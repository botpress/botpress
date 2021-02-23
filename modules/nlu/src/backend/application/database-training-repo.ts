import * as sdk from 'botpress/sdk'
import { TrainingRepository, TrainingId, TrainingState, TrainingSession } from './typings'

const TABLE_NAME = 'nlu_training_queue'

export class DatabaseTrainingRepository implements TrainingRepository {
  constructor(private _database: typeof sdk.database) {}

  public initialize = async (): Promise<void | void[]> => {
    await this._database.createTableIfNotExists(TABLE_NAME, table => {
      table.string('botId').notNullable() // TODO: this should not build if we change training sessions
      table.string('language').notNullable()
      table.string('status').notNullable()
      table.float('progress').notNullable()
      table.primary(['botId', 'language'])
    })
    return this.clear()
  }

  public getAll = async (): Promise<TrainingSession[]> => {
    let result: any
    try {
      result = await this._database(TABLE_NAME).select('*')
      return result
    } catch (err) {
      console.error(err, result)
      throw err
    }
  }

  public set = async (trainId: TrainingId, trainState: TrainingState): Promise<void> => {
    const { botId, language } = trainId
    const { progress, status } = trainState

    let result: any
    try {
      if (await this.has({ botId, language })) {
        result = await this._database(TABLE_NAME)
          .where({ botId, language })
          .update({ progress, status })
        return
      }
      result = await this._database(TABLE_NAME).insert({ botId, language, progress, status })
      return
    } catch (err) {
      console.error(err, result)
      throw err
    }
  }

  public has = async (trainId: TrainingId): Promise<boolean> => {
    const { botId, language } = trainId

    const result = !!(await this.get({ botId, language }))
    return result
  }

  public get = async (trainId: TrainingId): Promise<TrainingState | undefined> => {
    const { botId, language } = trainId

    let result: any
    try {
      result = await this._database
        .from(TABLE_NAME)
        .where({ botId, language })
        .select('*')
        .first()
      return result
    } catch (err) {
      console.error(err, result)
      throw err
    }
  }

  public query = async (query: Partial<TrainingSession>): Promise<TrainingSession[]> => {
    let result: any
    try {
      result = await this._database
        .from(TABLE_NAME)
        .where(query)
        .select('*')
      return result
    } catch (err) {
      console.error(err, result)
      throw err
    }
  }

  public clear = async (): Promise<void[]> => {
    let result: any
    try {
      result = await this._database.from(TABLE_NAME).delete('*')
      return result
    } catch (err) {
      console.error(err, result)
      throw err
    }
  }
}
