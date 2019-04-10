import _ from 'lodash'

import { SDK } from '.'

export default class AnalyticsDb {
  knex: any

  constructor(bp: SDK) {
    this.knex = bp.database
  }

  initializeDb = () => {
    if (!this.knex) {
      throw new Error('you must initialize the database before')
    }

    return this.knex
      .createTableIfNotExists('analytics_interactions', table => {
        table.increments('id').primary()
        table.timestamp('ts')
        table.string('type')
        table.string('text')
        table.string('channel')
        table.string('user_id')
        table.enu('direction', ['in', 'out'])
      })
      .then(() => {
        return this.knex.createTableIfNotExists('analytics_runs', table => {
          table.increments('id').primary()
          table.timestamp('ts')
        })
      })
      .then(() => {
        return this.knex.createTableIfNotExists('analytics_custom', table => {
          table.string('botId')
          table.string('date')
          table.string('name')
          table.integer('count')
          table.unique(['date', 'name'])
        })
      })
      .then(() => this.knex)
  }

  saveIncoming = event => {
    const interactionRow = {
      ts: this.knex.date.now(),
      type: event.type,
      text: event.payload.text,
      channel: event.channel,
      user_id: event.target,
      direction: 'in'
    }

    return this.knex('analytics_interactions').insert(interactionRow)
  }

  saveOutgoing = event => {
    const interactionRow = {
      ts: this.knex.date.now(),
      type: event.type,
      text: event.payload.text,
      channel: event.channel,
      user_id: event.target,
      direction: 'out'
    }

    return this.knex('analytics_interactions').insert(interactionRow)
  }
}
