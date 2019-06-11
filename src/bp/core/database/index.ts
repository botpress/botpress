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

  public async runCoreMigrations(dryRun?: boolean): Promise<number> {
    const dir = path.resolve(__dirname, './migrations')
    if (!fs.existsSync(dir)) {
      return 0
    }

    return this._runMigrations(dir, 'core', dryRun)
  }

  async runModuleMigrations(dbMigrationsDir: string[], dryRun?: boolean): Promise<number> {
    return this._runMigrations(dbMigrationsDir, 'module', dryRun)
  }

  private async _runMigrations(directory: string | string[], migrationType: string, dryRun?: boolean): Promise<number> {
    const migrationConfig = {
      directory,
      tableName: migrationType === 'core' ? 'knex_core_migrations' : 'knex_module_migrations',
      loadExtensions: ['.js']
    }

    // Status represents the negative number of migrations that needs to be executed
    const status = await this.knex.migrate.status(migrationConfig)
    if (!dryRun && status < 0) {
      await this.knex.migrate.latest(migrationConfig)
      this.logger.debug(`Executed ${-status} ${migrationType} migrations`)
    }

    return Math.abs(status)
  }
}
