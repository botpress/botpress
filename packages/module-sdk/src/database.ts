import Knex from 'knex'

export type ExtendedKnex = Knex & KnexExtension

export type ColumnOrDate = string | Date | Knex.Sql

export type KnexExtension_Date = {
  format(exp: any): Knex.Raw
  now(): Knex.Raw
  isBefore(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
  isAfter(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
  isBetween(date: ColumnOrDate, betweenA: ColumnOrDate, betweenB: ColumnOrDate): Knex.Raw
  isSameDay(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
  hourOfDay(date: ColumnOrDate): Knex.Raw
}

export type KnexExtension_Bool = {
  true(): any
  false(): any
  parse(value: any): boolean
}

export type KnexExtension_Json = {
  set(obj: any): any
  get(obj: any): any
}

export type KnexCallback = (tableBuilder: Knex.CreateTableBuilder) => any

export type KnexExtension = {
  isLite: boolean
  createTableIfNotExists(tableName: string, cb: KnexCallback): Promise<any>
  date: KnexExtension_Date
  bool: KnexExtension_Bool
  json: KnexExtension_Json
  insertAndRetrieve<T>(
    tableName: string,
    data: {},
    returnColumns?: string | string[],
    idColumnName?: string
  ): Promise<T>
}

export type QueryBuilder = Knex.QueryBuilder

export type GetOrCreateResult<T> = Promise<{
  created: boolean
  result: T
}>
