import { KnexExtended, Logger } from 'botpress/sdk'
import { TYPES } from 'core/types'
import { mkdirpSync } from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import path from 'path'

import AllTables from './database-tables'
import { patchKnex } from './helpers'
import { Table } from './interfaces'

export type DatabaseType = 'postgres' | 'sqlite'

@injectable()
export default class Database {
  knex!: KnexExtended

  private tables: Table[] = []

  public constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Database')
    private logger: Logger
  ) {}

  async bootstrap() {
    await Promise.mapSeries(AllTables, async Tbl => {
      const table = new Tbl(this.knex!)
      const created = await table.bootstrap()
      if (created) {
        this.logger.debug(`Created table '${table.name}'`)
      }
      this.tables.push(table)
    })
  }

  async seedForTests() {
    // Add seeding here
  }

  async teardownTables() {
    await Promise.mapSeries(AllTables, async Tbl => {
      const table = new Tbl(this.knex!)
      if (this.knex.isLite) {
        await this.knex.raw('PRAGMA foreign_keys = OFF;')
        await this.knex.raw(`DROP TABLE IF EXISTS "${table.name}";`)
        await this.knex.raw('PRAGMA foreign_keys = ON;')
      } else {
        await this.knex.raw(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`)
      }
    })
  }

  async initialize(databaseType?: DatabaseType, databaseUrl?: string) {
    const logger = this.logger
    const { DATABASE_URL, DATABASE_POOL } = process.env

    let poolOptions = {
      log: message => logger.warn(`[pool] ${message}`)
    }

    try {
      const customPoolOptions = DATABASE_POOL ? JSON.parse(DATABASE_POOL) : {}
      poolOptions = { ...poolOptions, ...customPoolOptions }
    } catch (err) {
      this.logger.warn('Database pool option is not valid json')
    }

    if (DATABASE_URL) {
      if (!databaseType) {
        databaseType = DATABASE_URL.toLowerCase().startsWith('postgres') ? 'postgres' : 'sqlite'
      }
      if (!databaseUrl) {
        databaseUrl = DATABASE_URL
      }
    }

    const config: Knex.Config = {
      useNullAsDefault: true,
      log: {
        error: message => logger.error(`[knex] ${message}`),
        warn: message => logger.warn(`[knex] ${message}`),
        debug: message => logger.debug(`[knex] ${message}`)
      }
    }

    if (databaseType === 'postgres') {
      const searchPath = (process.env.DATABASE_PG_SEARCH_PATH || 'public').split(',')
      Object.assign(config, {
        client: 'pg',
        connection: databaseUrl,
        pool: poolOptions,
        searchPath
      })
    } else {
      const dbLocation = databaseUrl ? databaseUrl : `${process.PROJECT_LOCATION}/data/storage/core.sqlite`
      mkdirpSync(path.dirname(dbLocation))

      Object.assign(config, {
        client: 'sqlite3',
        connection: { filename: dbLocation },
        pool: {
          afterCreate: (conn, cb) => {
            conn.run('PRAGMA foreign_keys = ON', cb)
          },
          ...poolOptions
        }
      })
    }

    this.knex = patchKnex(Knex(config))

    await this.bootstrap()
  }
}
