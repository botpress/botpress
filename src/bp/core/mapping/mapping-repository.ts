import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { inject, injectable, postConstruct } from 'inversify'

import LRU from 'lru-cache'
import ms from 'ms'

@injectable()
export class MappingRepository {
  private repos: { [botId: string]: ScopedMappingRepository } = {}
  private invalidateMappingCache: (scope: string, foreign: string, local: string) => void = this
    ._localInvalidateMappingCache

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService
  ) {}

  @postConstruct()
  async init() {
    this.invalidateMappingCache = <any>(
      await this.jobService.broadcast<void>(this._localInvalidateMappingCache.bind(this))
    )
  }

  forScope(scope: string) {
    let repo = this.repos[scope]
    if (!repo) {
      repo = new ScopedMappingRepository(scope, this.database, (foreign, local) =>
        this.invalidateMappingCache(scope, foreign, local)
      )
      this.repos[scope] = repo
    }
    return repo
  }

  private _localInvalidateMappingCache(scope: string, foreign: string, local: string) {
    this.forScope(scope).localInvalidateCache(foreign, local)
  }
}

class ScopedMappingRepository {
  private readonly TABLE_NAME = 'mapping'

  private localCache: LRU<string, string>
  private foreignCache: LRU<string, string>

  constructor(
    private scope: string,
    private database: Database,
    private invalidateCache: (foreign: string, local: string) => void
  ) {
    this.localCache = new LRU({ max: 20000, maxAge: ms('5m') })
    this.foreignCache = new LRU({ max: 20000, maxAge: ms('5m') })
  }

  public localInvalidateCache(foreign: string, local: string) {
    this.localCache.del(foreign)
    this.foreignCache.del(local)
  }

  async create(foreign: string, local: string): Promise<void> {
    if (!foreign?.length || !local?.length) {
      throw new Error('A mapping must be between two non null non empty strings')
    }

    await this.query().insert({ scope: this.scope, foreign, local })

    this.localCache.set(foreign, local)
    this.foreignCache.set(local, foreign)
  }

  async delete(foreign: string, local: string): Promise<boolean> {
    const deletedRows = await this.query()
      .where({ scope: this.scope, foreign, local })
      .del()

    this.invalidateCache(foreign, local)

    return deletedRows > 0
  }

  async getLocalId(foreign: string): Promise<string | undefined> {
    const cached = this.localCache.get(foreign)
    if (cached) {
      return cached
    }

    const rows = await this.query().where({ scope: this.scope, foreign })
    const local = rows[0]?.local

    if (local) {
      this.localCache.set(foreign, local)
    }

    return local
  }

  async getForeignId(local: string): Promise<string | undefined> {
    const cached = this.foreignCache.get(local)
    if (cached) {
      return cached
    }

    const rows = await this.query().where({ scope: this.scope, local })
    const foreign = rows[0]?.foreign

    if (foreign) {
      this.foreignCache.set(local, foreign)
    }

    return foreign
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }
}
