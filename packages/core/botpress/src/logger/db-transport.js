import winston from 'winston'

import { isEmpty } from 'lodash'

import helpers from '../database/helpers'

export default class DbTransport extends winston.Transport {
  constructor(opts) {
    super(opts)
    this.name = 'DBLogger'
    this.opts = opts
  }

  log(level, message, meta, callback) {
    if (!isEmpty(meta)) {
      message += ' ' + JSON.stringify(meta)
    }

    this.opts.db
      .get()
      .then(knex =>
        knex('logs').insert({
          level,
          message,
          created_on: helpers(knex).date.now()
        })
      )
      .then(() => {
        this.emit('logged')
        callback(null, true)
      })
      .catch(err => {
        callback(err, false)
      })
  }

  static async _query(db, limit = null, order = 'desc') {
    const knex = await db.get()
    let q = knex('logs')
      .select('created_on as timestamp', 'level', 'message')
      .orderBy('created_on', order)
    if (limit) {
      q = q.limit(limit)
    }
    return q.then()
  }
}
