import Knex from 'knex'
import moment from 'moment'

import {
  ColumnOrDate,
  KnexCallback,
  KnexExtension,
  KnexExtension_Bool,
  KnexExtension_Date,
  KnexExtension_Json
} from './interfaces'

export const patchKnex = (knex: Knex): Knex & KnexExtension => {
  const isLite = knex.client.config.client === 'sqlite3'

  const dateParse = (exp: string): Knex.Raw => {
    return isLite ? knex.raw(`strftime('%Y-%m-%dT%H:%M:%fZ', ${exp})`) : knex.raw(exp)
  }

  const dateFormat = (date: moment.MomentInput) => {
    const iso = moment(date)
      .toDate()
      .toISOString()
    return dateParse(`'${iso}'`)
  }

  const columnOrDateFormat = (colOrDate: ColumnOrDate) => {
    if ((<Knex.Sql>colOrDate).sql) {
      return (<Knex.Sql>colOrDate).sql
    }

    if (typeof colOrDate === 'string') {
      return isLite ? dateParse(colOrDate) : `"${colOrDate}"`
    }

    return dateFormat(<Date>colOrDate)
  }

  const createTableIfNotExists = async (tableName: string, cb: KnexCallback) => {
    return knex.schema.hasTable(tableName).then(exists => {
      if (exists) {
        return
      }
      return knex.schema.createTableIfNotExists(tableName, cb)
    })
  }

  const date: KnexExtension_Date = {
    format: dateFormat,
    now: () => (isLite ? knex.raw(`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`) : knex.raw('now()')),

    isBefore: (d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(d1)
      const exp2 = columnOrDateFormat(d2)
      return knex.raw(exp1 + ' < ' + exp2)
    },

    isAfter: (d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(d1)
      const exp2 = columnOrDateFormat(d2)
      return knex.raw(exp1 + ' > ' + exp2)
    },

    isBetween: (date: ColumnOrDate, betweenA: ColumnOrDate, betweenB: ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(date)
      const exp2 = columnOrDateFormat(betweenA)
      const exp3 = columnOrDateFormat(betweenB)

      return knex.raw(`${exp1} BETWEEN ${exp2} AND ${exp3}`)
    },

    isSameDay: (d1: ColumnOrDate, d2: ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(d1)
      const exp2 = columnOrDateFormat(d2)
      return knex.raw(`date(${exp1}) = date(${exp2})`)
    },

    hourOfDay: (date: ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(date)
      return isLite ? knex.raw(`strftime('%H', ${exp1})`) : knex.raw(`to_char(${exp1}, 'HH24')`)
    }
  }

  const bool: KnexExtension_Bool = {
    true: () => (isLite ? 1 : true),
    false: () => (isLite ? 0 : false),
    parse: value => (isLite ? !!value : value)
  }

  const json: KnexExtension_Json = {
    set: obj => (isLite ? obj && JSON.stringify(obj) : obj),
    get: obj => (isLite ? obj && JSON.parse(obj) : obj)
  }

  const extensions: KnexExtension = { isLite, date, json, bool, createTableIfNotExists }

  return Object.assign(knex, extensions)
}
