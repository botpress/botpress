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

  const _set = (key, value, operation = 'update') => {
    const now = helpers(knex).date.now()

    if (operation === 'update') {
      return knex(tableName).where({ key }).update({
        value: JSON.stringify(value),
        modified_on: now
      }).then()
    } else {
      return knex(tableName).insert({
        key: key,
        value: JSON.stringify(value),
        modified_on: now
      }).then()
    }
  }

  const set = (key, value, path) => {
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
            if (!_.isNil(original)) {
              const newObj = setValue(Object.assign({}, original))
              return _set(key, newObj, 'update')
            } else {
              const obj = setValue({})
              return _set(key, obj, 'insert')
                .catch(() => _set(key, obj, 'update'))
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
