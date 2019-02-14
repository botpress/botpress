import { Logger } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import Database from '../database'
import { safeStringify } from '../misc/utils'
import { TYPES } from '../types'

@injectable()
export class KeyValueStore {
  private readonly tableName = 'srv_kvs'

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'KVS')
    private logger: Logger
  ) {}

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
        ON CONFLICT (:keyCol:) DO UPDATE
          SET :valueCol: = :value, :modifiedOnCol: = :now
      `
    }

    return this.database.knex.raw(sql, params)
  }

  get = async (botId: string, key: string, path?: string) =>
    this.database
      .knex(this.tableName)
      .where({ botId })
      .andWhere({ key })
      .limit(1)
      .get(0)
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

    return this.get(botId, key).then(original => this.upsert(botId, key, setValue(original || {})))
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

  setStorageWithExpiry = async (botId: string, key: string, value, expiryInMs?: string) => {
    const box = this.boxWithExpiry(value, expiryInMs)
    await this.set(botId, key, box)
  }

  getStorageWithExpiry = async (botId: string, key: string) => {
    const box = await this.get(botId, key)
    return this.unboxWithExpiry(box)
  }

  removeStorageKeysStartingWith = async key => {
    await this.database
      .knex(this.tableName)
      .where('key', 'like', key + '%')
      .del()
  }

  getConversationStorageKey = (sessionId, variable) => `storage/conversation/${sessionId}/${variable}`
  getUserStorageKey = (userId, variable) => `storage/users/${userId}/${variable}`
  getGlobalStorageKey = variable => `storage/global/${variable}`
}
