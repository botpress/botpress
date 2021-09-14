import { TrainingStatus } from '@botpress/nlu-client'
import * as sdk from 'botpress/sdk'
import { StatusType } from './typings'

export interface ModelStatePrimaryKey {
  botId: string
  language: string
  status_type: StatusType
}

export interface ModelStateRow extends ModelStatePrimaryKey {
  modelId: string
  definitionHash: string
  status: TrainingStatus
  progress: number
}

export interface IModelStateRepository {
  get(key: ModelStatePrimaryKey): Promise<ModelStateRow | undefined>
  has(key: ModelStatePrimaryKey): Promise<boolean>
  upsert(model: ModelStateRow): Promise<void>
  insert(model: ModelStateRow): Promise<void>
  update(model: Partial<ModelStateRow>): Promise<void>
  del(key: ModelStatePrimaryKey): Promise<void>
  query(query: Partial<ModelStateRow>): Promise<ModelStateRow[]>
}

export class DbModelStateRepository implements IModelStateRepository {
  private _tableName = 'model_state'

  constructor(private _db: sdk.KnexExtended) {}

  public async initialize() {
    await this._db.createTableIfNotExists(this._tableName, table => {
      table.string('botId').notNullable()
      table.string('language').notNullable()
      table.string('status_type').notNullable()
      table.string('modelId').notNullable()
      table.string('definitionHash').notNullable()
      table.string('status').notNullable()
      table.float('progress').notNullable()
      table.primary(['botId', 'language', 'status_type'])
    })
  }

  public async get(key: ModelStatePrimaryKey): Promise<ModelStateRow | undefined> {
    return this._db
      .table<ModelStateRow>(this._tableName)
      .where(key)
      .select('*')
      .first()
  }

  public async upsert(model: ModelStateRow) {
    const exists = await this.has(model)
    if (exists) {
      return this.update(model)
    }
    return this.insert(model)
  }

  public async has(key: ModelStatePrimaryKey): Promise<boolean> {
    const x = await this.get(key)
    return !!x
  }

  public async insert(model: ModelStateRow): Promise<void> {
    return this._db.table<ModelStateRow>(this._tableName).insert(model)
  }

  public async update(model: Partial<ModelStateRow>): Promise<void> {
    const { modelId, definitionHash, ...key } = model
    return this._db
      .table<ModelStateRow>(this._tableName)
      .where(key)
      .update(model)
  }

  public async del(key: ModelStatePrimaryKey): Promise<void> {
    return this._db
      .table<ModelStateRow>(this._tableName)
      .where(key)
      .del()
  }

  public async query(query: Partial<ModelStateRow>): Promise<ModelStateRow[]> {
    return this._db
      .table<ModelStateRow>(this._tableName)
      .where(query)
      .select('*')
  }
}
