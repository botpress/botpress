import * as sdk from 'botpress/sdk'

/**
 * A bot can have up to one model and one training per language.
 * "ready" means the model is currently used for prediction.
 * "not-ready" means the model is currently being made.
 * */
type ModelStateStatus = 'ready' | 'not-ready'

interface ModelEntryPrimaryKey {
  botId: string
  language: string
  status: ModelStateStatus
}

interface ModelEntryRow extends ModelEntryPrimaryKey {
  modelId: string
  definitionHash: string
}

export class ModelEntryRepository {
  private _tableName = 'model_entry'

  constructor(private _db: sdk.KnexExtended) {}

  private get table() {
    return this._db.table<ModelEntryRow>(this._tableName)
  }

  public async initialize() {
    await this._db.createTableIfNotExists(this._tableName, table => {
      table.string('botId').notNullable()
      table.string('language').notNullable()
      table.string('status').notNullable()
      table.string('modelId').notNullable()
      table.string('definitionHash').notNullable()
      table.primary(['botId', 'language', 'status'])
    })
  }

  public async get(key: ModelEntryPrimaryKey): Promise<ModelEntryRow | undefined> {
    return this.table
      .where(key)
      .select('*')
      .first()
  }

  public async set(model: ModelEntryRow) {
    const { modelId, definitionHash, ...key } = model
    const exists = await this.has(key)
    if (exists) {
      return this._update(model)
    }
    return this._insert(model)
  }

  public async has(key: ModelEntryPrimaryKey): Promise<boolean> {
    const x = await this.get(key)
    return !!x
  }

  public async del(key: ModelEntryPrimaryKey): Promise<void> {
    return this.table.where(key).del()
  }

  private async _insert(model: ModelEntryRow): Promise<void> {
    return this.table.insert(model)
  }

  private async _update(model: Partial<ModelEntryRow>): Promise<void> {
    const { modelId, definitionHash, ...key } = model
    return this.table.where(key).update(model)
  }
}
