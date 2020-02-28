import * as sdk from 'botpress/sdk'
import Knex from 'knex'
import { mergeWith } from 'lodash'
import ms from 'ms'
import moment from 'moment'

const TABLE_NAME = 'bot_analytics'

const Metric = <const>[
  'sessions_count',
  'sessions_start_nlu_none',
  'msg_received_count',
  'msg_sent_count',
  'msg_sent_qna_count',
  'msg_nlu_none',
  'top_msg_nlu_none',

  // TODO: implement these below in 12.8+
  'goals_started_count',
  'goals_completed_count',
  'goals_failed_count',
  'feedback_positive_qna',
  'feedback_negative_qna',
  'feedback_positive_goal',
  'feedback_negative_goal'
]
type MetricTypes = typeof Metric[number]
type Entry = { [key in MetricTypes]: number }

const createEntry = (): Entry =>
  Metric.reduce((acc, curr) => {
    acc[curr] = 0
    return acc
  }, {} as any)

const mergeEntries = (a: Entry, b: Entry): Entry => {
  return mergeWith(createEntry(), a, b, (v1, v2) => v1 + v2)
}

export default class Db {
  private knex: Knex & sdk.KnexExtension
  private cache_rows: Dic<boolean> = {}
  private cache_entries: Dic<Entry> = {}
  private flush_lock: boolean

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
    setInterval(() => this.flushMetrics(), ms('10s'))
    setInterval(() => (this.cache_rows = {}), ms('1h')) // to prevent this object from getting too big
  }

  async initialize() {
    await this.knex.createTableIfNotExists(TABLE_NAME, table => {
      table.string('botId').notNullable()
      table.string('date').notNullable()
      table.string('channel').notNullable()
      table.primary(['botId', 'date', 'channel'])

      Metric.forEach(element => {
        table
          .integer(element)
          .notNullable()
          .defaultTo(0)
      })
    })
  }

  private getDate() {
    return `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`
  }

  private getCacheKey(botId: string, channel: string) {
    return `${this.getDate()}/${botId}/${channel}`
  }

  incrementMetric(botId: string, channel: string, metric: MetricTypes) {
    const key = this.getCacheKey(botId, channel)
    if (!this.cache_entries[key]) {
      this.cache_entries[key] = createEntry()
    }
    this.cache_entries[key][metric]++
  }

  private async flushMetrics() {
    // the lock ensures only one instance of this function can run at any given point
    if (this.flush_lock) {
      return
    }
    this.flush_lock = true

    try {
      for (let key in this.cache_entries) {
        let numbers = this.cache_entries[key]
        try {
          // the cache clears itself out so there's no memory leak
          delete this.cache_entries[key]

          const parts = key.split('/')
          const filter = { botId: parts[1], date: parts[0], channel: parts[2] }

          if (!this.cache_rows[key]) {
            await this.knex(TABLE_NAME)
              .insert(filter)
              .then(() => (this.cache_rows[key] = true))
              .catch(err => {
                /* the row already exists */
              })
          }

          await this.knex(TABLE_NAME)
            .increment(numbers as any)
            .where(filter)
        } catch {
          // We restore previous analytics to increment
          // And we also make sure that we don't lose new increments that might have been added during the DB query failure
          this.cache_entries[key] = this.cache_entries[key] ? mergeEntries(this.cache_entries[key], numbers) : numbers
        }
      }
    } finally {
      this.flush_lock = false
    }
  }

  async getMetrics(botId: string, options?: { startDate: Date; endDate: Date; channel: string }) {
    let startDate = options?.startDate ?? new Date()
    let endDate = options?.endDate ?? new Date()

    let queryMetrics = this.knex(TABLE_NAME)
      .select()
      .where({ botId })
      .andWhere(this.knex.date.isBetween('date', startDate, endDate))

    let queryNewUsers = this.knex('bot_chat_users')
      .where({ botId })
      .andWhere(this.knex.date.isBetween('createdOn', startDate, endDate))

    let queryActiveUsers = this.knex('bot_chat_users')
      .where({ botId })
      .andWhere(this.knex.date.isBetween('lastSeenOn', startDate, endDate))

    if (options?.channel !== 'all') {
      queryMetrics = queryMetrics.andWhere({ channel: options.channel })
      queryNewUsers = queryNewUsers.andWhere({ channel: options.channel })
      queryActiveUsers = queryActiveUsers.andWhere({ channel: options.channel })
    }

    try {
      const metrics = await queryMetrics
      const newUsersCount = await queryNewUsers.count('*')
      const activeUsersCount = await queryActiveUsers.count('*')

      return [] // TODO transform results
    } catch (err) {
      console.log(err)
      //
    }
  }
}
