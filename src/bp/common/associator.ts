import * as sdk from 'botpress/sdk'
import LRUCache from 'lru-cache'
import ms from 'ms'

export class Associator {
  private tableName: string
  private localCache: LRUCache<string, string>
  private foreignCache: LRUCache<string, string>

  constructor(private bp: typeof sdk, private type: string) {
    this.tableName = `associate_${this.type}`

    this.localCache = new LRUCache({ max: 20000, maxAge: ms('5m') })
    this.foreignCache = new LRUCache({ max: 20000, maxAge: ms('5m') })
  }

  async initialize() {
    await this.bp.database.createTableIfNotExists(this.tableName, table => {
      table.string('foreign').primary()
      table.string('local').unique()
    })
  }

  async link(foreign: string, local: string) {
    await this.query().insert({ foreign, local })

    this.localCache.set(foreign, local)
    this.foreignCache.set(local, foreign)
  }

  async unlink(foreign: string, local: string) {
    const deletedRows = await this.query()
      .where({ foreign, local })
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

    const rows = await this.query().where({ foreign })
    const local = rows[0]?.local
    this.localCache.set(foreign, local)

    return local
  }

  async getForeign(local: string): Promise<string | undefined> {
    const cached = this.foreignCache.get(local)
    if (cached) {
      return cached
    }

    const rows = await this.query().where({ local })
    const foreign = rows[0]?.foreign
    this.foreignCache.set(local, foreign)

    return foreign
  }

  private query() {
    return this.bp.database(this.tableName)
  }
}
