import * as sdk from 'botpress/sdk'

interface ModelPrimaryKey {
  botId: string
  language: string
  state: 'ready' | 'training'
}

interface ModelInfo extends ModelPrimaryKey {
  modelId: string
  definitionHash: string
}

export interface IModelStateRepository {
  get(key: ModelPrimaryKey): Promise<ModelInfo | undefined>
  has(key: ModelPrimaryKey): Promise<boolean>
  set(model: ModelInfo): Promise<void>
  del(key: ModelPrimaryKey): Promise<void>
  query(query: Partial<ModelInfo>): Promise<ModelInfo[]>
}

export class DbModelStateRepository implements IModelStateRepository {
  private _tableName = 'model_state'

  constructor(private _db: sdk.KnexExtended) {}

  public async initialize() {
    await this._db.createTableIfNotExists(this._tableName, table => {
      table.string('botId').notNullable()
      table.string('language').notNullable()
      table.string('state').notNullable()
      table.string('modelId').notNullable()
      table.string('definitionHash').notNullable()
      table.primary(['botId', 'language', 'state'])
    })
  }

  public async get(key: ModelPrimaryKey): Promise<ModelInfo | undefined> {
    return this._db
      .table(this._tableName)
      .where(key)
      .select('*')
      .first()
  }

  public async has(key: ModelPrimaryKey): Promise<boolean> {
    return !!(await this.get(key))
  }

  public async set(model: ModelInfo): Promise<void> {
    const { modelId, definitionHash, ...key } = model
    if (await this.has(key)) {
      return this._db
        .table(this._tableName)
        .where(key)
        .update(model)
    }
    return this._db.table(this._tableName).insert(model)
  }

  public async del(key: ModelPrimaryKey): Promise<void> {
    return this._db
      .table(this._tableName)
      .where(key)
      .del()
  }

  public async query(query: Partial<ModelInfo>): Promise<ModelInfo[]> {
    return this._db
      .table(this._tableName)
      .where(query)
      .select('*')
  }
}
