import * as sdk from 'botpress/sdk'
import { Transaction } from 'knex'
import moment from 'moment'
import { TrainingId, TrainingState, TrainingSession, I } from './typings'

const TABLE_NAME = 'nlu_training_queue'

class TransactionContext {
  constructor(protected _database: typeof sdk.database, public transaction: Transaction | null = null) {}

  private get table() {
    if (this.transaction) {
      return this._database.table(TABLE_NAME).transacting(this.transaction)
    }
    return this._database.table(TABLE_NAME)
  }

  public set = async (trainId: TrainingId, trainState: TrainingState): Promise<void> => {
    const { botId, language } = trainId
    const { progress, status, owner } = trainState

    const modifiedOn = this._database.date.now()
    if (await this.has({ botId, language })) {
      return this.table.where({ botId, language }).update({ progress, status, modifiedOn })
    }
    return this.table.insert({ botId, language, progress, status, modifiedOn, owner })
  }

  public has = async (trainId: TrainingId): Promise<boolean> => {
    const { botId, language } = trainId
    const result = !!(await this.get({ botId, language }))
    return result
  }

  public get = async (trainId: TrainingId): Promise<TrainingSession | undefined> => {
    const { botId, language } = trainId

    return this._database
      .from(TABLE_NAME)
      .where({ botId, language })
      .select('*')
      .first()
  }

  public getAll = async (): Promise<TrainingSession[]> => {
    return this.table.select('*')
  }

  public query = async (query: Partial<TrainingSession>): Promise<TrainingSession[]> => {
    return this._database
      .from(TABLE_NAME)
      .where(query)
      .select('*')
  }

  public delete = async (trainId: TrainingId): Promise<void> => {
    const { botId, language } = trainId
    return this.table.where({ botId, language }).delete()
  }

  public clear = async (): Promise<void[]> => {
    return this.table.delete('*')
  }
}

export type ITrainingRepository = I<TrainingRepository>
export class TrainingRepository extends TransactionContext implements TrainingRepository {
  constructor(_database: typeof sdk.database) {
    super(_database)
  }

  public initialize = async (): Promise<void | void[]> => {
    return void this._database.createTableIfNotExists(TABLE_NAME, table => {
      table.string('botId').notNullable()
      table.string('language').notNullable()
      table.string('status').notNullable()
      table.string('owner').notNullable()
      table.float('progress').notNullable()
      table.timestamp('modifiedOn').notNullable()
      table.primary(['botId', 'language'])
    })
  }

  public inTransaction = async (action: (trx: TransactionContext) => Promise<void>) => {
    this._database.transaction(async trx => {
      try {
        const ctx = new TransactionContext(this._database, trx)
        await action(ctx)
        trx.commit()
      } catch (err) {
        trx.rollback()
      }
    })
  }
}

export const isTrainingAlive = (training: TrainingSession, ms: number) => {
  const now = moment()
  const timeOfDeath = moment(now.clone()).subtract(ms, 'ms')

  const { modifiedOn } = training
  const lastlyUpdated = moment(modifiedOn)
  return !lastlyUpdated.isBefore(timeOfDeath)
}
