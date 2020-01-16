import * as sdk from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import Database from '../database'
import { safeStringify } from '../misc/utils'
import { TYPES } from '../types'

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
    return this.forBot(botId).get(key, path)
  }

  set = (botId: string, key: string, value, path?: string) => {
    return this.forBot(botId).set(key, value, path)
  }

  setStorageWithExpiry = async (botId: string, key: string, value, expiryInMs?: string) => {
    return this.forBot(botId).setStorageWithExpiry(key, value, expiryInMs)
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

  private _upsert = (key: string, value) => {
    let sql

    const { botId } = this

    const params = {
      tableName: TABLE_NAME,
      botIdCol: 'botId',
      keyCol: 'key',
      valueCol: 'value',
      modifiedOnCol: 'modified_on',
      botId,
      key,
      value: safeStringify(value),
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
        ON CONFLICT (:keyCol:, :botIdCol:) DO UPDATE
          SET :valueCol: = :value, :modifiedOnCol: = :now
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
  }

  set = async (key: string, value, path?: string) => {
    if (!path) {
      return this._upsert(key, value)
    }

    const setValue = obj => {
      if (path) {
        _.set(obj, path, value)
        return obj
      } else {
        return value
      }
    }

    return this.get(key).then(original => this._upsert(key, setValue(original || {})))
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

  setStorageWithExpiry = async (key: string, value, expiryInMs?: string) => {
    await this.set(key, this.boxWithExpiry(value, expiryInMs))
  }

  getStorageWithExpiry = async key => {
    return this.unboxWithExpiry(await this.get(key))
  }

  removeStorageKeysStartingWith = async key => {
    await this.database
      .knex(TABLE_NAME)
      .where('key', 'like', key + '%')
      .del()
  }

  getConversationStorageKey = (sessionId, variable) => `storage/conversation/${sessionId}/${variable}`
  getUserStorageKey = (userId, variable) => `storage/users/${userId}/${variable}`
  getGlobalStorageKey = variable => `storage/global/${variable}`
}
