import Promise from 'bluebird'
import helpers from './database_helpers'
import _ from 'lodash'

/*
  Possible options:
    - betweenGetAndSetCallback: will be called between the get and the set
    and wait for promise to resolve
    - tableName: overrides the KVS table's name
*/
module.exports = (knex, options = {}) => {
  const getSetCallback = options.betweenGetAndSetCallback || (() => Promise.resolve())
  const tableName = options.tableName || 'kvs'

  const get = (key, path) => {
    return knex(tableName).where({ key }).limit(1).then().get(0).then(row => {
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
    const now = helpers(knex).date.now()

    const setValue = obj => {
      if (path) {
        _.set(obj, path, value)
        return obj
      } else {
        return value
      }
    }

    return get(key)
    .then(original => {
      return getSetCallback()
      .then(() => {
        if (original) {
          const newObj = setValue(Object.assign({}, original))
          return knex(tableName).where({ key }).update({
            value: JSON.stringify(newObj),
            modified_on: now
          }).then()
        } else {
          const obj = setValue({})
          return knex(tableName).insert({
            key: key,
            value: JSON.stringify(obj),
            modified_on: now
          }).then()
        }
      })
    })
  }

  const bootstrap = () => {
    return helpers(knex).createTableIfNotExists(tableName, function(table) {
      table.string('key').primary()
      table.text('value')
      table.timestamp('modified_on')
    })
  }

  return { get, set, bootstrap }
}
