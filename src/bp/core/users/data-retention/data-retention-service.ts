import { RetentionPolicy } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { TYPES } from 'core/types'
import diff from 'deep-diff'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { getPaths } from './util'

interface ExpiredData {
  channel: string
  user_id: string
  field_path: string
}

@injectable()
export class DataRetentionService {
  private readonly tableName = 'data_retention'
  private policies: RetentionPolicy | undefined
  private DELETED_ATTR = 'D'

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database
  ) {}

  async initialize(): Promise<void> {
    const config = await this.configProvider.getBotpressConfig()
    this.policies = config.dataRetention && config.dataRetention.policies
  }

  hasPolicy(): boolean {
    return !_.isEmpty(this.policies)
  }

  async updateExpirationForChangedFields(
    channel: string,
    user_id: string,
    beforeAttributes: any,
    afterAttributes: any
  ) {
    const differences = diff(getPaths(beforeAttributes), getPaths(afterAttributes))
    if (!differences || !this.policies) {
      return
    }

    const changedPaths = _.flatten(differences.filter(diff => diff.kind !== this.DELETED_ATTR).map(diff => diff.path))
    if (!changedPaths.length) {
      return
    }

    for (const field in this.policies) {
      if (changedPaths.indexOf(field) > -1) {
        const expiry = moment()
          .add(ms(this.policies[field]), 'ms')
          .toDate()

        if (await this.get(channel, user_id, field)) {
          await this.update(channel, user_id, field, expiry)
        } else {
          await this.insert(channel, user_id, field, expiry)
        }
      }
    }
  }

  private async get(channel: string, user_id: string, field_path: string) {
    return this.database
      .knex(this.tableName)
      .where({ channel, user_id, field_path })
      .limit(1)
      .select('expiry_date')
      .first()
  }

  private async insert(channel: string, user_id: string, field_path: string, expiry_date: Date) {
    await this.database.knex(this.tableName).insert({
      channel,
      user_id,
      field_path,
      expiry_date: this.database.knex.date.format(expiry_date),
      created_on: this.database.knex.date.now()
    })
  }

  private async update(channel: string, user_id: string, field_path: string, expiry_date: Date) {
    await this.database
      .knex(this.tableName)
      .update({ expiry_date: this.database.knex.date.format(expiry_date) })
      .where({ channel, user_id, field_path })
  }

  async delete(channel: string, user_id: string, field_path: string): Promise<void> {
    await this.database
      .knex(this.tableName)
      .where({ channel, user_id, field_path })
      .del()
  }

  async getExpired(batchSize): Promise<ExpiredData[]> {
    return this.database
      .knex(this.tableName)
      .andWhere(this.database.knex.date.isBefore('expiry_date', new Date()))
      .select('channel', 'user_id', 'field_path')
      .limit(batchSize)
  }
}
