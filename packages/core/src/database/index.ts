import { ExtendedKnex, Logger } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'

import { DatabaseConfig } from '../config/botpress.config'
import { TYPES } from '../misc/types'

import { patchKnex } from './helpers'
import { Table } from './interfaces'
import AllTables from './tables'

@injectable()
export default class Database {
  knex!: ExtendedKnex

  private tables: Table[] = []

  public constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Database')
    private logger: Logger
  ) {}

  async initialize(dbConfig: DatabaseConfig) {
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

    this.knex = patchKnex(await Knex(config))

    await Promise.mapSeries(AllTables, async Tbl => {
      const table = new Tbl(this.knex!)
      await table.bootstrap()
      this.logger.debug(`Created table '${table.name}'`)
      this.tables.push(table)
    })

    this.logger.info('Created database')
  }

  runMigrations() {
    // TODO
  }
}
