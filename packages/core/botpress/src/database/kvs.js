/**
 * The KVS (Key-Value Store) serves as a convenient, high-level data storing mechanism.
 * The KVS is an abstraction layer on top of the configured [Botpress Database]{@link Database}
 * @public
 * @namespace KVS
 * @example
 * bp.kvs
 * bp.db.kvs // ⚠️ Deprecated, will be removed in Botpress 11
 */

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

  /**
   * Returns the unserialized value stored at a given key
   * @param  {String} key  The unique key where you want to get the value at
   * @param  {String=} [path] If specified, returns the value at the path inside the retrieved object (if stored object was an object).
   * @return {?*} Returns the unserialized object of any type stored at that key or null if it doesn't exist
   * @example
   * // Assuming 'user001' is an Object like `{ profile: { first_name: "Sylvain" } }`
   * const first_name = await bp.kvs.get('user001', 'profile.first_name')
   * const fullUser = await bp.kvs.get('user001')
   *
   * // You can also retrieve array elements
   * const first_subscriber = await bp.kvs.get('subscribers', '[0].name')
   * @memberOf! KVS
   * @async
   */
  const get = (key, path) =>
    knex(tableName)
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

        return _.get(obj, path)
      })

  /**
   * Serializes and stores any value at the specified key, and optionally set a value inside an existing object at `path`.
   * @param  {String} key   The unique key of the value you want to store
   * @param  {*} value The value to store. Note that if you provide an object or array, it will be serialized to JSON automatically.
   * Therefore, you have to make sure that your object is serializable (i.e. it has no circular references)
   * @param  {String=} [path]  The path inside the object to set the value (see example)
   * @example
   * const user = { profile: { name: 'Sylvain' } }
   * await bp.kvs.set('user001', user)
   *
   * // You can later overwrite the `name` property directly
   * await bp.kvs.set('user001', 'Sylvain Perron', 'name')
   * @async
   * @memberof! KVS
   */
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

    return get(key).then(original => getSetCallback().then(() => upsert(key, setValue(original || {}))))
  }

  const bootstrap = () =>
    helpers(knex).createTableIfNotExists(tableName, table => {
      table.string('key').primary()
      table.text('value')
      table.timestamp('modified_on')
    })

  return { get, set, bootstrap }
}
