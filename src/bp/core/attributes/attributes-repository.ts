import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { inject, injectable, postConstruct } from 'inversify'
import LRUCache from 'lru-cache'
import ms from 'ms'

@injectable()
export class AttributesRepository {
  private readonly TABLE_NAME = 'attributes'
  private cache: LRUCache<sdk.uuid, string>
  private invalidateAttributeCache: (entityId: sdk.uuid, attribute: string, value: string | undefined) => void = this
    ._localInvalidateAttributeCache

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    this.cache = new LRUCache({ max: 50000, maxAge: ms('20m') })
  }

  @postConstruct()
  async init() {
    this.invalidateAttributeCache = <any>(
      await this.jobService.broadcast<void>(this._localInvalidateAttributeCache.bind(this))
    )
  }

  private _localInvalidateAttributeCache(entityId: sdk.uuid, attribute: string, value: string | undefined) {
    const cached = this.cache.get(entityId)
    if (cached) {
    }
  }

  async set(entityId: sdk.uuid, attribute: string, value: string): Promise<void> {
    const current = await this.get(entityId, attribute)

    if (!current) {
      await this.query().insert({ entityId, attribute, value })
    } else if (value !== current) {
      await this.query()
        .where({ entityId, attribute })
        .update({ value })

      this.invalidateAttributeCache(entityId, attribute, value)
    }
  }

  async remove(entityId: sdk.uuid, attribute: string): Promise<boolean> {
    const deletedRows = await this.query()
      .where({ entityId, attribute })
      .del()

    this.invalidateAttributeCache(entityId, attribute, undefined)

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
