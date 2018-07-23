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

export type ColumnOrDate = string | Date | Knex.Raw

export interface KnexExtension {
  isLite: boolean

  date: {
    format(exp: any): Knex.Raw,
    isBefore(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
    isAfter(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
    isBetween(date: ColumnOrDate, betweenA: ColumnOrDate, betweenB: ColumnOrDate): Knex.Raw
    isSameDay(d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw
    hourOfDay(date: ColumnOrDate): Knex.Raw
  },

  bool: {
    true(): Knex.Raw
    false(): Knex.Raw
    parse(value: any): boolean
  },

  json: {
    set(obj: any): any
    get(obj: any): any
  }
}
