import Knex from 'knex'

export type ExtendedKnex = Knex & KnexExtension

export abstract class Table {
  _knex: ExtendedKnex

  constructor(knex: ExtendedKnex) {
    this._knex = knex
  }

  abstract bootstrap(): Promise<void>

  abstract get Name(): string
}

export abstract class DatabaseMigration {
  abstract up(knex: ExtendedKnex): Promise<void>
  abstract down(knex: ExtendedKnex): Promise<void>
}

export type ColumnOrDate = string | Date | Knex.Sql

export type KnexExtension_Date = {
  format(exp: any): Knex.Raw,
  now(): Knex.Raw,
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
  isLite: boolean,
  createTableIfNotExists(tableName: string, cb: KnexCallback): Promise<any>,
  date: KnexExtension_Date,
  bool: KnexExtension_Bool,
  json: KnexExtension_Json
}