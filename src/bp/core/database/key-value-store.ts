/**
 * The KVS (Key-Value Store) serves as a convenient, high-level data storing mechanism.
 * The KVS is an abstraction layer on top of the configured [Botpress Database]{@link Database}
 * @public
 * @namespace KVS
 * @example
 * bp.kvs
 * bp.db.kvs // ⚠️ Deprecated, will be removed in Botpress 11
 */

import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { TYPES } from '../types'

import Database from '.'

@injectable()
export class KeyValueStore {
  /**
   * onGetOrSet will be called between the get and the set and wait for promise to resolve
   */
  public onGetOrSet: (() => Promise<void>) | undefined

  private readonly tableName = 'srv_kvs'

  constructor(@inject(TYPES.Database) private database: Database) {}

  upsert = (botId: string, key: string, value) => {
    let sql

    const params = {
      tableName: this.tableName,
      botIdCol: 'botId',
      keyCol: 'key',
      valueCol: 'value',
      modifiedOnCol: 'modified_on',
      botId,
      key,
      value: JSON.stringify(value),
      now: this.database.knex.date.now()
    }

    if (this.database.knex.isLite) {
      sql = `
        INSERT OR REPLACE INTO :tableName: (:botIdCol:, :keyCol:, :valueCol:, :modifiedOnCol:)
        VALUES (:botId, :key, :value, :now)
      `
    } else {
      sql = `
        INSERT INTO :tableName: (:botIdCol:, :keyCol:, :valueCol:, :modifiedOnCol:)
        VALUES (:botId, :key, :value, :now)
        ON CONFLICT (:keyCol:) DO UPDATE
          SET :valueCol: = :value, :modifiedOnCol: = :now
      `
    }

    return this.database.knex.raw(sql, params)
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
  get = async (key: string, path?: string) =>
    this.database
      .knex(this.tableName)
      .where({ key })
      .limit(1)
      .then(row => {
        if (!row) {
          return undefined
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
  set = (botId: string, key: string, value, path?: string) => {
    if (!path) {
      return this.upsert(botId, key, value)
    }

    const setValue = obj => {
      if (path) {
        _.set(obj, path, value)
        return obj
      } else {
        return value
      }
    }

    return this.get(key).then(
      original => this.onGetOrSet && this.onGetOrSet().then(() => this.upsert(botId, key, setValue(original || {})))
    )
  }
}
