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
  removePayload(uuid: string): Promise<any>
  getAll(): Promise<any>
}

@injectable()
export class KnexTelemetryPayloadRepository implements TelemetryPayloadRepository {
  private readonly tableName = 'telemetry_table'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async getAll(): Promise<any> {
    return await this.database.knex.from(this.tableName).select('*')
  }

  async insertPayload(uuid: string, url: string, payload: JSON) {
    await this.database.knex(this.tableName).insert({ uuid: uuid, url: url, payload: JSON.stringify(payload) })
  }

  async getPayload(uuid: string): Promise<any> {
    const payload = await this.database.knex
      .from(this.tableName)
      .select('*')
      .where('uuid', uuid)
    return payload
  }

  async removePayload(uuid: string): Promise<any> {
    throw new Error('Method not implemented.')
  }
}
