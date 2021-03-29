import * as sdk from 'botpress/sdk'
import { Transaction } from 'knex'
import ms from 'ms'
import { TrainingId, TrainingState, TrainingSession, I } from './typings'

const TABLE_NAME = 'nlu_training_queue'
const TRANSACTION_TIMEOUT_MS = ms('5s')
const debug = DEBUG('nlu').sub('database')

const timeout = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Transaction exceeded it's time limit")), ms)
  })
}

export type ITrainingTransactionContext = I<TrainingTransactionContext>
class TrainingTransactionContext {
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
      return this.table.where({ botId, language }).update({ progress, status, modifiedOn, owner })
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

    return this.table
      .where({ botId, language })
      .select('*')
      .first()
  }

  public getAll = async (): Promise<TrainingSession[]> => {
    return this.table.select('*')
  }

  public query = async (query: Partial<TrainingSession>): Promise<TrainingSession[]> => {
    return this.table.where(query).select('*')
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
export class TrainingRepository implements TrainingRepository {
  private _context: TrainingTransactionContext
  constructor(private _database: typeof sdk.database) {
    this._context = new TrainingTransactionContext(this._database, null)
  }

  public initialize = async (): Promise<void | void[]> => {
    return void this._database.createTableIfNotExists(TABLE_NAME, table => {
      table.string('botId').notNullable()
      table.string('language').notNullable()
      table.string('status').notNullable()
      table.string('owner').nullable()
      table.float('progress').notNullable()
      table.timestamp('modifiedOn').notNullable()
      table.primary(['botId', 'language'])
    })
  }

  public inTransaction = async (
    action: (trx: ITrainingTransactionContext) => Promise<any>,
    name: string | null = null
  ): Promise<any> => {
    return this._database.transaction(async trx => {
      const operation = async () => {
        try {
          debug(`Starting transaction ${name}`)
          const ctx = new TrainingTransactionContext(this._database, trx)
          const res = await action(ctx)
          await trx.commit(res)
          return res
        } catch (err) {
          await trx.rollback(err)
          debug(`Error in transaction: ${err}`)
        } finally {
          debug(`Finishing transaction ${name}`)
        }
      }
      return Promise.race([operation(), timeout(TRANSACTION_TIMEOUT_MS)])
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
