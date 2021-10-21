import * as sdk from 'botpress/sdk'
import Knex from 'knex'
import { mergeWith, omit, take, Dictionary } from 'lodash'
import moment from 'moment'
import ms from 'ms'

export const TABLE_NAME = 'bot_analytics'

const Metric = <const>[
  'sessions_count',
  'sessions_start_nlu_none',
  'msg_received_count',
  'msg_sent_count',
  'msg_sent_qna_count',
  'top_msg_nlu_none',
  'enter_flow_count',
  'msg_nlu_intent',
  'msg_nlu_language',

  'workflow_started_count',
  'workflow_completed_count',
  'workflow_failed_count',

  'feedback_positive_qna',
  'feedback_negative_qna',
  'feedback_positive_workflow',
  'feedback_negative_workflow'
]
export type MetricTypes = typeof Metric[number]

const mergeEntries = (a: Dictionary<number>, b: Dictionary<number>): Dictionary<number> => {
  return mergeWith(a, b, (v1, v2) => (v1 || 0) + (v2 || 0))
}

export default class Database {
  knex: Knex & sdk.KnexExtension
  private readonly flusher: ReturnType<typeof setInterval>

  private cache_entries: Dictionary<number> = {}
  private flush_lock: boolean

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
    this.flusher = setInterval(() => this.flushMetrics(), ms('10s'))
  }

  // Mostly useful for tests - kill the setInterval so jest can exit
  destroy() {
    clearInterval(this.flusher)
  }

  async initialize() {
    await this.knex.createTableIfNotExists(TABLE_NAME, table => {
      table.string('botId').notNullable()
      table
        .date('date')
        .notNullable()
        .defaultTo(this.knex.date.today())
      table.string('channel').notNullable()
      table.string('metric').notNullable()
      table
        .string('subMetric')
        .notNullable()
        .defaultTo('')
      table
        .integer('value')
        .notNullable()
        .defaultTo(0)
      table.primary(['botId', 'date', 'channel', 'metric', 'subMetric'])
    })
  }

  private getCacheKey(botId: string, channel: string, metric: string, subMetric?: string) {
    const today = moment().format('YYYY-MM-DD')
    return `${today}|${botId}|${channel}|${metric}|${subMetric || ''}`
  }

  incrementMetric(botId: string, channel: string, metric: MetricTypes, subMetric?: string) {
    const key = this.getCacheKey(botId, channel, metric, subMetric)
    this.cache_entries[key] = (this.cache_entries[key] || 0) + 1
  }

  private async flushMetrics() {
    // the lock ensures only one instance of this function can run at any given point
    if (this.flush_lock) {
      return
    }
    this.flush_lock = true

    try {
      // we batch maximum 1000 rows in the same query
      const original = this.cache_entries
      const keys = take(Object.keys(this.cache_entries), 1000)
      if (!keys.length) {
        return
      }
      this.cache_entries = omit(this.cache_entries, keys)
      // build a master query

      const values = keys
        .map(key => {
          const [date, botId, channel, metric, subMetric] = key.split('|')
          const value = original[key]
          return this.knex
            .raw('(:date:, :botId, :channel, :metric, :subMetric, :value)', {
              date: this.knex.raw(`date('${date}')`),
              botId,
              channel,
              metric,
              subMetric,
              value
            })
            .toQuery()
        })
        .join(',')

      const query = this.knex
        .raw(
          // careful if changing this query, make sure it works in both SQLite and Postgres
          `insert into ${TABLE_NAME}
(date, "botId", channel, metric, "subMetric", value) values ${values}
  on conflict(date, "botId", channel, metric, "subMetric")
  do update set value = ${TABLE_NAME}.value + EXCLUDED.value`
        )
        .toQuery()

      await this.knex
        .transaction(async trx => {
          await trx.raw(query)
        })
        .catch(_err => {
          // we restore rows we couldn't insert
          this.cache_entries = mergeEntries(original, this.cache_entries)
        })
    } finally {
      // release the lock
      this.flush_lock = false
    }
  }

  async getMetrics(botId: string, options?: { startDate: Date; endDate: Date; channel: string }) {
    const startDate = options?.startDate ?? new Date()
    const endDate = options?.endDate ?? new Date()

    let queryMetrics = this.knex(TABLE_NAME)
      .select()
      .where({ botId })
      .andWhere(this.knex.date.isBetween('date', startDate, endDate))

    let queryNewUsers = this.knex('bot_chat_users')
      .where({ botId })
      .andWhere(this.knex.date.isBetween('createdOn', startDate, endDate))
      .groupBy(['createdOn', 'channel'])

    let queryReturningUsers = this.knex('bot_chat_users')
      .where({ botId })
      .andWhere(this.knex.date.isBetween('lastSeenOn', startDate, endDate))
      .groupBy(['lastSeenOn', 'channel'])
      .andWhereRaw('"lastSeenOn" <> "createdOn"')

    let queryActiveUsers = this.knex('bot_chat_users')
      .where({ botId })
      .andWhere(this.knex.date.isBetween('lastSeenOn', startDate, endDate))
      .groupBy(['lastSeenOn', 'channel'])

    if (options?.channel !== 'all') {
      queryMetrics = queryMetrics.andWhere({ channel: options.channel })
      queryNewUsers = queryNewUsers.andWhere({ channel: options.channel })
      queryActiveUsers = queryActiveUsers.andWhere({ channel: options.channel })
      queryReturningUsers = queryReturningUsers.andWhere({ channel: options.channel })
    }

    try {
      const metrics = await queryMetrics
      const newUsersCount = await queryNewUsers.select(
        'createdOn as date',
        'channel',
        this.knex.raw('count(*) as value')
      )
      const activeUsersCount = await queryActiveUsers.select(
        'lastSeenOn as date',
        'channel',
        this.knex.raw('count(*) as value')
      )
      const returningUsersCount = await queryReturningUsers.select(
        'lastSeenOn as date',
        'channel',
        this.knex.raw('count(*) as value')
      )

      return [
        ...metrics,
        ...newUsersCount.map(x => ({ ...x, value: Number(x.value), metric: 'new_users_count' })),
        ...activeUsersCount.map(x => ({ ...x, value: Number(x.value), metric: 'active_users_count' })),
        ...returningUsersCount.map(x => ({ ...x, value: Number(x.value), metric: 'returning_users_count' }))
      ].map(x => ({ ...x, created_on: x.date, date: moment(x.date).format('YYYY-MM-DD') }))
    } catch (err) {
      this.bp.logger.attachError(err).warn('Could not retrieve analytics')
      return []
    }
  }
}
