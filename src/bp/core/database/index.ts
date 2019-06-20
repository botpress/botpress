import { Logger } from 'botpress/sdk'
import { KnexExtension } from 'common/knex'
import { TYPES } from 'core/types'
import fs from 'fs'
import { inject, injectable, tagged } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import path from 'path'

import { patchKnex } from './helpers'
import { Table } from './interfaces'
import AllTables from './tables'

export type DatabaseType = 'postgres' | 'sqlite'

@injectable()
export default class Database {
  knex!: Knex & KnexExtension

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
        await this.knex.raw(`PRAGMA foreign_keys = OFF;`)
        await this.knex.raw(`DROP TABLE IF EXISTS "${table.name}";`)
        await this.knex.raw(`PRAGMA foreign_keys = ON;`)
      } else {
        await this.knex.raw(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`)
      }
    })
  }

  async initialize(databaseType: DatabaseType, databaseUrl?: string) {
    const config: Knex.Config = {
      useNullAsDefault: true
    }

    if (databaseType === 'postgres') {
      Object.assign(config, {
        client: 'pg',
        connection: databaseUrl
      })
    } else {
      const dbLocation = databaseUrl ? databaseUrl : `${process.PROJECT_LOCATION}/data/storage/core.sqlite`

      Object.assign(config, {
        client: 'sqlite3',
        connection: { filename: dbLocation },
        pool: {
          afterCreate: (conn, cb) => {
            conn.run('PRAGMA foreign_keys = ON', cb)
          }
        }
      })
    }

    this.knex = patchKnex(await Knex(config))

    await this.bootstrap()
  }
}
