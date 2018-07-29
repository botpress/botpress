import winston from 'winston'
import ms from 'ms'

import { isEmpty } from 'lodash'

import helpers from '../database/helpers'
import { safeStringify } from '../util'

const LOGS_FLUSH_INTERVAL = ms('2s')
const LOGS_CHUNK_SIZE = 1000

export default class DbTransport extends winston.Transport {
  constructor(opts) {
    super(opts)
    this.name = 'DBLogger'
    this.db = opts.db

    opts.janitor.add({
      table: 'logs',
      ttl: opts.ttl
    })

    this.flushInterval = setInterval(this.flush, LOGS_FLUSH_INTERVAL)
  }

  flushPromise = null
  batches = []

  doFlush = async () => {
    const batch = this.batches.shift()

    try {
      if (!batch || !batch.length) {
        return
      }

      const knex = await this.db.get()
      await knex.batchInsert('logs', batch, LOGS_CHUNK_SIZE).then()
    } catch (err) {
      // We put the logs back on the queue in position 1
      // so that the next call will insert them in the right order
      // This works since `batchInsert` wraps the op in a transaction
      this.batches.unshift(batch)
    }
  }

  flush = async () => {
    if (this.flushPromise) {
      return // Previous flush is not done running
    }

    this.flushPromise = this.doFlush()

    await this.flushPromise
    this.flushPromise = null
  }

  log(level, message, meta, callback) {
    if (!isEmpty(meta)) {
      message += ` (meta=${safeStringify(meta)})`
    }

    this.db
      .get()
      .then(knex => {
        const row = {
          level,
          message,
          created_on: helpers(knex).date.format(new Date())
        }

        if (this.batches.length) {
          this.batches[this.batches.length - 1].push(row)
        } else {
          this.batches.push([row])
        }
        this.emit('logged')
        callback(null, true)
      })
      .catch(err => {
        callback(err, null)
      })
  }

  static async _query(db, limit = null, order = 'desc') {
    const knex = await db.get()
    let q = knex('logs')
      .select('created_on as timestamp', 'level', 'message')
      .orderBy('created_on', order)
      .orderBy('id', order)
    if (limit) {
      q = q.limit(limit)
    }
    return q.then()
  }
}
