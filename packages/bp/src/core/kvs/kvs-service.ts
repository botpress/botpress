import * as sdk from 'botpress/sdk'
import Database from 'core/database'
import { safeStringify } from 'core/misc/utils'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

const GLOBAL = '__global__'
const TABLE_NAME = 'srv_kvs'

@injectable()
export class KeyValueStore {
  private services: _.Dictionary<KvsService> = {}
  private globalKvs: KvsService

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'KVS')
    private logger: sdk.Logger
  ) {
    this.globalKvs = new KvsService(this.database, this.logger)
  }

  public global() {
    return this.globalKvs
  }

  public forBot(botId: string) {
    if (!!this.services[botId]) {
      return this.services[botId]
    }

    const newService = new KvsService(this.database, this.logger, botId)
    this.services[botId] = newService
    return newService
  }

  // All these are deprecated in sdk. Should be removed.

  get = async (botId: string, key: string, path?: string) => {
    this.logger.warn('bp.kvs.get is deprecated, use bp.kvs.global().get or bp.kvs.forBot(botId).get')
    return this.forBot(botId).get(key, path)
  }

  set = (botId: string, key: string, value, path?: string) => {
    this.logger.warn('bp.kvs.set is deprecated, use bp.kvs.global().set or bp.kvs.forBot(botId).set')
    return this.forBot(botId).set(key, value, path)
  }

  setStorageWithExpiry = async (botId: string, key: string, value, expiry?: string) => {
    return this.forBot(botId).setStorageWithExpiry(key, value, expiry)
  }

  getStorageWithExpiry = async (botId: string, key: string) => {
    return this.forBot(botId).getStorageWithExpiry(key)
  }

  removeStorageKeysStartingWith = async key => {
    return this.globalKvs.removeStorageKeysStartingWith(key)
  }

  getConversationStorageKey = (sessionId, variable) => {
    return this.globalKvs.getConversationStorageKey(sessionId, variable)
  }

  getUserStorageKey = (userId, variable) => {
    return this.globalKvs.getUserStorageKey(userId, variable)
  }

  getGlobalStorageKey = variable => {
    return this.globalKvs.getGlobalStorageKey(variable)
  }
}

export class KvsService implements sdk.KvsService {
  constructor(private database: Database, private logger: sdk.Logger, private botId: string = GLOBAL) {}

  private _upsert = (key: string, value, expireOn?: any) => {
    const params = {
      botId: this.botId,
      key,
      value: safeStringify(value),
      expireOn: expireOn ?? null,
      now: this.database.knex.date.now()
    }

    let sql
    if (this.database.knex.isLite) {
      sql = `
        INSERT OR REPLACE INTO ${TABLE_NAME} ("botId", key, value, "expireOn", modified_on)
        VALUES (:botId, :key, :value, :expireOn, :now)
      `
    } else {
      sql = `
        INSERT INTO ${TABLE_NAME} ("botId", key, value, "expireOn", modified_on)
        VALUES (:botId, :key, :value, :expireOn, :now)
        ON CONFLICT (key, "botId") DO UPDATE
          SET value = :value, modified_on = :now, "expireOn" = :expireOn
      `
    }

    return this.database.knex.raw(sql, params)
  }

  get = async (key: string, path?: string) => {
    const { botId } = this

    return this.database
      .knex(TABLE_NAME)
      .where({ botId })
      .andWhere({ key })
      .first()
      .then(async row => {
        if (!row) {
          return undefined
        }

        if (row.expireOn && moment().isAfter(moment(row.expireOn))) {
          await this.delete(key)
          return undefined
        }

        const obj = JSON.parse(row.value)
        if (!path) {
          return obj
        }

        return _.get(obj, path)
      })
  }

  set = async (key: string, value, path?: string, expiry?: string) => {
    const expireOn = expiry
      ? moment()
          .add(ms(expiry), 'milliseconds')
          .toDate()
      : undefined

    if (!path) {
      return this._upsert(key, value, expireOn)
    }

    const setValue = obj => {
      if (path) {
        _.set(obj, path, value)
        return obj
      } else {
        return value
      }
    }

    return this.get(key).then(original => this._upsert(key, setValue(original || {}), expireOn))
  }

  delete = async (key: string) => {
    const { botId } = this

    await this.database
      .knex(TABLE_NAME)
      .where({ botId })
      .andWhere({ key })
      .del()
  }

  exists = async (key: string) => {
    const result = await this.get(key)
    return !!result
  }

  private boxWithExpiry = (value, expiry = 'never') => {
    const expiryDate = expiry === 'never' ? 'never' : moment().add(ms(expiry), 'milliseconds')

    return { value, expiry: expiryDate }
  }

  private unboxWithExpiry = box => {
    if (box && box.expiry && (box.expiry === 'never' || moment(box.expiry).isAfter())) {
      return box.value
    }

    return undefined
  }

  setStorageWithExpiry = async (key: string, value, expiry?: string) => {
    await this.set(key, this.boxWithExpiry(value, expiry))
  }

  getStorageWithExpiry = async (key: string) => {
    return this.unboxWithExpiry(await this.get(key))
  }

  removeStorageKeysStartingWith = async (key: string) => {
    await this.database
      .knex(TABLE_NAME)
      .where('key', 'like', key + '%')
      .del()
  }

  getConversationStorageKey = (sessionId, variable) => `storage/conversation/${sessionId}/${variable}`
  getUserStorageKey = (userId, variable) => `storage/users/${userId}/${variable}`
  getGlobalStorageKey = variable => `storage/global/${variable}`
}
