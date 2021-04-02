import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { inject, injectable } from 'inversify'

@injectable()
export class AttributesRepository {
  private readonly TABLE_NAME = 'attributes'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async set(entityId: sdk.uuid, attribute: string, value: string): Promise<void> {
    await this.query().insert({ entityId, attribute, value })
  }

  async remove(entityId: sdk.uuid, attribute: string): Promise<boolean> {
    const deletedRows = await this.query()
      .where({ entityId, attribute })
      .del()

    return deletedRows > 0
  }

  async get(entityId: sdk.uuid, attribute: string): Promise<string> {
    const entry = await this.query().where({ entityId, attribute })
    return entry[0]?.value
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }
}
