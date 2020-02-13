import { Analytics, AnalyticsMethod, MetricDefinition } from 'botpress/sdk'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import moment from 'moment'

const TABLE_NAME = 'srv_analytics'

@injectable()
export class AnalyticsRepository {
  constructor(@inject(TYPES.Database) private db: Database) {}

  async insert(args: { botId: string; channel: string; metric: string; value: number }, trx?: Knex.Transaction) {
    const { botId, channel, metric, value } = args
    let query = this.db
      .knex(TABLE_NAME)
      .insert({ botId, channel, metric_name: metric, value, created_on: this.db.knex.date.now() })

    if (trx) {
      query = query.transacting(trx)
    }
    return query
  }

  async update(id: number, value: number, trx?: Knex.Transaction) {
    let query = this.db
      .knex(TABLE_NAME)
      .update({ value, updated_on: this.db.knex.date.now() })
      .where({ id })

    if (trx) {
      query = query.transacting(trx)
    }
    return query
  }

  async insertOrUpdate(def: MetricDefinition, trx?: Knex.Transaction) {
    const { botId, channel, metric } = def
    const value = def.increment || 1
    const analytics = await this.get({ botId, channel, metric }, trx)
    if (!analytics) {
      return this.insert({ botId, channel, metric, value: value }, trx)
    }

    // Aggregate metrics per day
    const latest = moment(analytics.created_on).startOf('day')
    const today = moment().startOf('day')

    if (latest.isBefore(today) && def.method === AnalyticsMethod.IncrementDaily) {
      return this.insert({ botId, channel, metric, value }, trx)
    } else if (latest.isBefore(today) && def.method === AnalyticsMethod.IncrementTotal) {
      return this.insert({ botId, channel, metric, value: analytics.value + value }, trx)
    } else if (latest.isBefore(today) && def.method === AnalyticsMethod.Replace) {
      return this.insert({ botId, channel, metric, value }, trx)
    } else if (def.method === AnalyticsMethod.Replace) {
      return this.update(analytics.id, value, trx)
    } else {
      return this.update(analytics.id, analytics.value + value, trx)
    }
  }

  async insertMany(metricDefs: MetricDefinition[]): Promise<void> {
    const trx = await this.db.knex.transaction()
    try {
      await Promise.mapSeries(metricDefs, def => this.insertOrUpdate(def, trx))
      await trx.commit()
    } catch (err) {
      await trx.rollback(err)
    }
  }

  async get(
    args: { botId: string; channel: string; metric: string },
    trx?: Knex.Transaction
  ): Promise<Analytics | undefined> {
    const { botId, channel, metric } = args
    let query = this.db
      .knex(TABLE_NAME)
      .select()
      .where({ botId, channel, metric_name: metric })
      .orderBy('created_on', 'desc')
      .first()

    if (trx) {
      query = query.transacting(trx)
    }

    return query
  }

  async getBetweenDates(botId: string, startDate: Date, endDate: Date, channel?: string): Promise<Analytics[]> {
    const includeEndDate = moment(endDate).add(1, 'day')

    let query = this.db
      .knex(TABLE_NAME)
      .select()
      .whereBetween('created_on', [startDate.toISOString(), includeEndDate.toISOString()])
      .andWhere({ botId })

    if (channel) {
      query = query.andWhere({ channel })
    }

    return query
  }
}
