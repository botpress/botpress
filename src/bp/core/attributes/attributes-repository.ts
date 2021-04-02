import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { inject, injectable } from 'inversify'
import LRUCache from 'lru-cache'
import ms from 'ms'

@injectable()
export class AttributesRepository {
  private readonly TABLE_NAME = 'attributes'
  private cache: LRUCache<sdk.uuid, string>

  constructor(@inject(TYPES.Database) private database: Database) {
    this.cache = new LRUCache({ max: 50000, maxAge: ms('20m') })
  }

  async set(entityId: sdk.uuid, attribute: string, value: string): Promise<void> {
    const current = await this.get(entityId, attribute)

    if (!current) {
      await this.query().insert({ entityId, attribute, value })
    } else if (value !== current) {
      await this.query()
        .where({ entityId, attribute })
        .update({ value })

      // TODO invalidate cache
    }
  }

  async remove(entityId: sdk.uuid, attribute: string): Promise<boolean> {
    const deletedRows = await this.query()
      .where({ entityId, attribute })
      .del()

    // TODO invalidate cache

    return deletedRows > 0
  }

  async get(entityId: sdk.uuid, attribute: string): Promise<string> {
    const cached = this.cache.get(entityId)
    if (cached) {
      return cached
    }

    const entry = await this.query().where({ entityId, attribute })
    const value = entry[0]?.value

    if (value) {
      this.cache.set(entityId, value)
    }

    return value
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }
}
