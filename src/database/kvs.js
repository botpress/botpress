import Promise from 'bluebird'
import _ from 'lodash'

import helpers from './helpers'

/*
  Possible options:
    - betweenGetAndSetCallback: will be called between the get and the set
    and wait for promise to resolve
    - tableName: overrides the KVS table's name
*/
module.exports = (knex, options = {}) => {
  const getSetCallback = options.betweenGetAndSetCallback || (() => Promise.resolve())
  const tableName = options.tableName || 'kvs'

  const upsert = (key, value) => {
    let sql

    const params = {
      tableName,
      keyCol: 'key',
      valueCol: 'value',
      modifiedOnCol: 'modified_on',
      key,
      value: JSON.stringify(value),
      now: helpers(knex).date.now()
    }

    if (helpers(knex).isLite()) {
      sql = `
        INSERT OR REPLACE INTO :tableName: (:keyCol:, :valueCol:, :modifiedOnCol:)
        VALUES (:key, :value, :now)
      `
    } else {
      sql = `
        INSERT INTO :tableName: (:keyCol:, :valueCol:, :modifiedOnCol:)
        VALUES (:key, :value, :now)
        ON CONFLICT (:keyCol:) DO UPDATE
          SET :valueCol: = :value, :modifiedOnCol: = :now
      `
    }

    return knex.raw(sql, params)
  }

  const get = (key, path) => {
    return knex(tableName)
      .where({ key })
      .limit(1)
      .then()
      .get(0)
      .then(row => {
        if (!row) {
          return null
        }

        const obj = JSON.parse(row.value)
        if (!path) {
          return obj
        }

        return _.at(obj, [path])[0]
      })
  }

  const set = (key, value, path) => {
    if (!path) {
      return upsert(key, value)
    }

    const setValue = obj => {
      if (path) {
        _.set(obj, path, value)
        return obj
      } else {
        return value
      }
    }

    return get(key).then(original => {
      return getSetCallback().then(() => {
        if (!_.isNil(original)) {
          return upsert(key, setValue(Object.assign({}, original)))
        } else {
          return upsert(key, setValue({}))
        }
      })
    })
  }

  const bootstrap = () =>
    helpers(knex).createTableIfNotExists(tableName, table => {
      table.string('key').primary()
      table.text('value')
      table.timestamp('modified_on')
    })

  return { get, set, bootstrap }
}
