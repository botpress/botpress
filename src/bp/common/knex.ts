import Knex from 'knex'

export interface KnexExtension {
  isLite: boolean
  createTableIfNotExists(tableName: string, cb: Knex.KnexCallback): Promise<boolean>
  date: Knex.Date
  bool: Knex.Bool
  json: Knex.Json
  insertAndRetrieve<T>(
    tableName: string,
    data: {},
    returnColumns?: string | string[],
    idColumnName?: string
  ): Promise<T>
}

// const f: Knex
