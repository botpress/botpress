import { DataRetentionService } from 'core/services/retention/service'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import moment from 'moment'

import Database from '../database'
import { TYPES } from '../types'

export interface TelemetryPayloadRepository {
  getPayload(uuid: string): Promise<any>
  insertPayload(uuid: string, payload: JSON): Promise<void>
  removePayload(uuid: string): Promise<void>
  removeArray(uuidArray: string[]): Promise<void>
  updateArray(uuidArray: string[], status: boolean): Promise<void>
  refreshAvailability(): Promise<void>
  getN(n: number): Promise<any>
}

@injectable()
export class KnexTelemetryPayloadRepository implements TelemetryPayloadRepository {
  private readonly tableName = 'telemetry_payloads'
  private readonly awsURL = 'https://telemetry.botpress.dev'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async refreshAvailability(): Promise<void> {
    const time = moment(new Date())
      .subtract(5, 'minute')
      .toISOString()

    const events = await this.database.knex
      .from(this.tableName)
      .select('uuid')
      .where(function() {
        this.where('lastChanged', '<', time)
      })

    const uuidArray = events.map(event => event.uuid)

    await this.updateArray(uuidArray, true)
  }

  async updateArray(uuidArray: string[], status: boolean): Promise<void> {
    if (uuidArray.length > 0) {
      await this.database
        .knex(this.tableName)
        .whereIn('uuid', uuidArray)
        .update({
          uuid: undefined,
          payload: undefined,
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
      await this.updateArray(uuidArray, false)
    }
    return { url: this.awsURL, events: events.map(event => event.payload) }
  }

  async insertPayload(uuid: string, payload: JSON) {
    await this.database.knex(this.tableName).insert({
      uuid: uuid,
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
