import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { inject, injectable } from 'inversify'

import LRU from 'lru-cache'
import ms from 'ms'

@injectable()
export class MappingRepository {
  private repos: { [botId: string]: ScopedMappingRepository } = {}

  constructor(@inject(TYPES.Database) private database: Database) {}

  forScope(scope: string) {
    let repo = this.repos[scope]
    if (!repo) {
      repo = new ScopedMappingRepository(scope, this.database)
      this.repos[scope] = repo
    }
    return repo
  }
}

class ScopedMappingRepository {
  private readonly TABLE_NAME = 'mapping'

  private localCache: LRU<string, string>
  private foreignCache: LRU<string, string>

  constructor(private scope: string, private database: Database) {
    this.localCache = new LRU({ max: 20000, maxAge: ms('5m') })
    this.foreignCache = new LRU({ max: 20000, maxAge: ms('5m') })
  }

  async make(foreign: string, local: string) {
    await this.query().insert({ scope: this.scope, foreign, local })

    this.localCache.set(foreign, local)
    this.foreignCache.set(local, foreign)
  }

  async unmake(foreign: string, local: string) {
    const deletedRows = await this.query()
      .where({ scope: this.scope, foreign, local })
      .del()

    this.localCache.del(foreign)
    this.foreignCache.del(local)

    return deletedRows > 0
  }

  async getLocal(foreign: string): Promise<string | undefined> {
    const cached = this.localCache.get(foreign)
    if (cached) {
      return cached
    }

    const rows = await this.query().where({ scope: this.scope, foreign })
    const local = rows[0]?.local
    this.localCache.set(foreign, local)

    return local
  }

  async getForeign(local: string): Promise<string | undefined> {
    const cached = this.foreignCache.get(local)
    if (cached) {
      return cached
    }

    const rows = await this.query().where({ scope: this.scope, local })
    const foreign = rows[0]?.foreign
    this.foreignCache.set(local, foreign)

    return foreign
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }
}
