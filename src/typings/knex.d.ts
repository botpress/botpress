import 'knex'

type OriginalDate = Date

declare module 'knex' {
  interface QueryBuilder {
    // get(index?: number): ChainableInterface
  }

  type ColumnOrDate = string | OriginalDate | Sql

  interface Date {
    set(date?: OriginalDate): any
    get(date: any): OriginalDate

    format(exp: any): Raw
    now(): Raw
    today(): Raw
    isBefore(d1: ColumnOrDate, d2: ColumnOrDate): Raw
    isBeforeOrOn(d1: ColumnOrDate, d2: ColumnOrDate): Raw
    isAfter(d1: ColumnOrDate, d2: ColumnOrDate): Raw
    isAfterOrOn(d1: ColumnOrDate, d2: ColumnOrDate): Raw
    isBetween(date: ColumnOrDate, betweenA: ColumnOrDate, betweenB: ColumnOrDate): Raw
    isSameDay(d1: ColumnOrDate, d2: ColumnOrDate): Raw
    hourOfDay(date: ColumnOrDate): Raw
  }

  interface Bool {
    true(): any
    false(): any
    parse(value: any): boolean
  }

  interface Json {
    set(obj: any): any
    get(obj: any): any
  }

  interface Binary {
    set(data: string | Buffer): any
  }

  type KnexCallback = (tableBuilder: CreateTableBuilder) => any

  type GetOrCreateResult<T> = Promise<{
    created: boolean
    result: T
  }>
}
