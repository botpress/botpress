import 'bluebird-global'
import Knex from 'knex'
import { inject, injectable, named, tagged } from 'inversify'
import _ from 'lodash'

import { patchKnex } from './helpers'
import { Logger } from '../misc/interfaces'
import { Table, ExtendedKnex } from './interfaces'
import { TYPES } from '../misc/types'

import AllTables from './tables'
import { DatabaseType } from '../botpress.config'

export interface DatabaseConfig {
  migrations?: string
  type: DatabaseType
  url?: string
  location?: string
  host?: string
  port?: number
  user?: string
  password?: string
  ssl?: boolean
  database?: string
}

@injectable()
export default class Database {
  knex: ExtendedKnex

  private tables: Table[] = []

  public constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Database')
    private logger: Logger
  ) {}

  async initialize(dbConfig: DatabaseConfig) {
    this.logger.info('Starting database initialization ...')
    const config: Knex.Config = {
      useNullAsDefault: true
    }

    if (dbConfig.type.toLowerCase() === 'postgres') {
      Object.assign(config, {
        client: 'pg',
        connection: dbConfig.url || _.pick(dbConfig, ['host', 'port', 'user', 'password', 'database', 'ssl'])
      })
    } else {
      Object.assign(config, {
        client: 'sqlite3',
        connection: { filename: dbConfig.location }
      })
    }

    const knex = await Knex(config)
    this.knex = patchKnex(knex)

    await Promise.mapSeries(AllTables, async Tbl => {
      const table = new Tbl(this.knex)
      await table.bootstrap()
      this.tables.push(table)
    })

    this.logger.info('Done.')
  }

  runMigrations() {
    // TODO
  }
}
