import Knex from 'knex'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { patchKnex } from './helpers'
import { Logger } from '../misc/interfaces'
import { Table, ExtendedKnex } from './interfaces'
import { TYPES } from '../misc/types'

import ModulesTable from './tables/modules'
import MetadataTable from './tables/metadata'

@injectable()
export default class Database {

  private _logger: Logger
  private _knex: ExtendedKnex
  private tables: Table[] = []

  public constructor(@inject(TYPES.Logger_Database) logger: Logger) {
    this._logger = logger
  }

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

    const knex = await Knex(config)
    this._knex = patchKnex(knex)

    this.tables.push(new MetadataTable(this._knex))
    this.tables.push(new ModulesTable(this._knex))

    await Promise.mapSeries(this.tables, table => table.bootstrap())
  }

  runMigrations() {
    // TODO
  }
}

export interface DatabaseConfig {
  migrations?: string
  type: string
  url?: string
  location?: string
  host?: string
  port?: number
  user?: string
  password?: string
  ssl?: boolean
  database?: string
}
