import { DataRetentionService } from 'core/services/retention/service'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import ms from 'ms'

import Database from '../database'
import { TYPES } from '../types'

export interface TelemetryPayloadRepository {
  getPayload(uuid: string): Promise<any>
  insertPayload(uuid: string, url: string, payload: JSON): Promise<void>
  removePayload(uuid: string): Promise<void>
  removeArray(uuidArray: string[]): Promise<void>
  updateArray(uuidArray: string[], status: boolean): Promise<void>
  getAll(): Promise<any>
  getN(n: number): Promise<any>
}

@injectable()
export class KnexTelemetryPayloadRepository implements TelemetryPayloadRepository {
  private readonly tableName = 'telemetry_payloads'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async updateArray(uuidArray: string[], status: boolean): Promise<void> {
    if (uuidArray.length > 0) {
      await this.database
        .knex(this.tableName)
        .whereIn('uuid', uuidArray)
        .update({
          uuid: undefined,
          payload: undefined,
          url: undefined,
          available: status,
          lastChanged: new Date().toISOString()
        })
    }
  }

  async removeArray(uuidArray: string[]) {
    await this.database
      .knex(this.tableName)
      .whereIn('uuid', uuidArray)
      .del()
  }

  async getN(n: number): Promise<any> {
    const events = await this.database.knex
      .from(this.tableName)
      .select('*')
      .where('available', true)
      .limit(n)

    if (events.length > 0) {
      const uuidArray = events.map(event => event.uuid)
      console.log(uuidArray)
      await this.updateArray(uuidArray, false)
    }

    console.log(events)
    return events
  }

  async getAll(): Promise<any> {
    return await this.database.knex.from(this.tableName).select('*')
  }

  async insertPayload(uuid: string, url: string, payload: JSON) {
    await this.database.knex(this.tableName).insert({
      uuid: uuid,
      url: url,
      payload: JSON.stringify(payload),
      available: true,
      lastChanged: new Date().toISOString()
    })
  }

  async getPayload(uuid: string): Promise<any> {
    const payload = await this.database.knex
      .from(this.tableName)
      .select('*')
      .where('uuid', uuid)
    return payload
  }

  async removePayload(uuid: string): Promise<any> {
    await this.database
      .knex(this.tableName)
      .where({ uuid: uuid })
      .del()
  }
}
