import * as sdk from 'botpress/sdk'
import Knex from 'knex'
import { mergeWith, omit, take } from 'lodash'
import moment from 'moment'
import ms from 'ms'

const migration: sdk.ModuleMigration = {
  info: {
    description: '',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const EVENT_DATE_FORMAT = 'YYY-MM-DD'
    const TABLE_NAME = 'bot_analytics'
    const knex: Knex & sdk.KnexExtension = bp.database

    let cache_entries: Dic<number> = {}
    const bots = await bp.bots.getAllBots()

    let flush_lock = false
    let computed_entries = 0

    const getCacheKey = (botId: string, channel: string, metric: string, subMetric?: string, date?: string) => {
      date = date ? date : moment().format(EVENT_DATE_FORMAT)

      return `${date}|${botId}|${channel}|${metric}|${subMetric || ''}`
    }

    const mergeEntries = (a: Dic<number>, b: Dic<number>): Dic<number> => {
      return mergeWith(a, b, (v1, v2) => (v1 || 0) + (v2 || 0))
    }

    const flushMetrics = async () => {
      // the lock ensures only one instance of this function can run at any given point
      if (flush_lock) {
        return
      }
      flush_lock = true

      try {
        // we batch maximum 1000 rows in the same query
        const original = cache_entries
        const keys = take(Object.keys(cache_entries), 1000)
        if (!keys.length) {
          return
        }
        cache_entries = omit(cache_entries, keys)
        // build a master query

        const values = keys
          .map(key => {
            const [date, botId, channel, metric, subMetric] = key.split('|')
            const value = original[key]

            return knex
              .raw('(:date:, :botId, :channel, :metric, :subMetric, :value)', {
                date: knex.raw(`date('${date}')`),
                botId,
                channel,
                metric,
                subMetric,
                value
              })
              .toQuery()
          })
          .join(',')

        const query = knex
          .raw(
            // careful if changing this query, make sure it works in both SQLite and Postgres
            `
              insert into ${TABLE_NAME}
                (date, "botId", channel, metric, "subMetric", value)
              values ${values} on conflict(date, "botId", channel, metric, "subMetric")
              do
              update set value = ${TABLE_NAME}.value + EXCLUDED.value
            `
          )
          .toQuery()

        await knex
          .transaction(async trx => {
            await trx.raw(query)
            computed_entries += values.length
          })
          .catch(_err => {
            // we restore rows we couldn't insert
            cache_entries = mergeEntries(original, cache_entries)
          })
      } finally {
        // release the lock
        flush_lock = false
      }
    }

    const promises = []
    bots.forEach(async ({ id: botId }) => {
      promises.push(bp.events.findEvents({ botId }))
    })

    void Promise.all(promises).then(allStoredEvents => {
      allStoredEvents.forEach(storedEvents => {
        storedEvents.forEach(storedEvent => {
          const event = storedEvent.event as sdk.IO.IncomingEvent
          const intentName = event.nlu?.intent?.name

          if (!!intentName?.length) {
            const key = getCacheKey(
              event.botId,
              event.channel,
              'msg_nlu_intent!confidence',
              intentName,
              moment(storedEvent.createdOn).format(EVENT_DATE_FORMAT)
            )

            cache_entries[key] = (cache_entries[key] || 0) + (event.nlu?.intent?.confidence || 0)
          }
        })
      })
    })

    setInterval(() => flushMetrics(), ms('10s'))

    if (!cache_entries) {
      return { success: true, message: `${computed_entries} Events intents saved to analytics database successfully` }
    }
  }
}

export default migration
