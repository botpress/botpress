import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { inject, injectable, postConstruct } from 'inversify'
import LRUCache from 'lru-cache'
import ms from 'ms'

@injectable()
export class AttributesRepository {
  private repos: { [botId: string]: ScopedAttributesRepository } = {}
  private invalidateAttributesCache: (attribute: string, entity: string, value: string | undefined) => void = this
    ._localInvalidateAttributesCache

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService
  ) {}

  @postConstruct()
  async init() {
    this.invalidateAttributesCache = <any>(
      await this.jobService.broadcast<void>(this._localInvalidateAttributesCache.bind(this))
    )
  }

  forAttribute(attribute: string) {
    let repo = this.repos[attribute]
    if (!repo) {
      repo = new ScopedAttributesRepository(attribute, this.database, (entity, value) =>
        this.invalidateAttributesCache(attribute, entity, value)
      )
      this.repos[attribute] = repo
    }
    return repo
  }

  private _localInvalidateAttributesCache(attribute: string, entity: sdk.uuid, value: string | undefined) {
    this.forAttribute(attribute).localInvalidateCache(entity, value)
  }
}

export class ScopedAttributesRepository {
  private readonly TABLE_NAME = 'attributes'
  private cache: LRUCache<sdk.uuid, string>

  constructor(
    private attribute: string,
    private database: Database,
    private invalidateCache: (entity: sdk.uuid, value: string | undefined) => void
  ) {
    this.cache = new LRUCache({ max: 2000, maxAge: ms('5m') })
  }

  public localInvalidateCache(entity: sdk.uuid, value: string | undefined) {
    const cached = this.cache.get(entity)
    if (cached) {
      if (value) {
        this.cache.set(entity, value)
      } else {
        this.cache.del(entity)
      }
    }
  }

  async set(entity: sdk.uuid, value: string): Promise<void> {
    const current = await this.get(entity)

    if (!current) {
      await this.query().insert({ entity, attribute: this.attribute, value })
    } else if (value !== current) {
      await this.query()
        .where({ entity, attribute: this.attribute })
        .update({ value })

      this.invalidateCache(entity, value)
    }
  }

  async remove(entity: sdk.uuid): Promise<boolean> {
    const deletedRows = await this.query()
      .where({ entity, attribute: this.attribute })
      .del()

    this.invalidateCache(entity, undefined)

    return deletedRows > 0
  }

  async get(entity: sdk.uuid): Promise<string> {
    const cached = this.cache.get(entity)
    if (cached) {
      return cached
    }

    const entry = await this.query().where({ entity, attribute: this.attribute })
    const value = entry[0]?.value

    if (value) {
      this.cache.set(entity, value)
    }

    return value
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }
}
