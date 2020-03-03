import * as sdk from 'botpress/sdk'
import _ from 'lodash'

const MAX_CHAR_LEN = 254
const extractText = event => ((event.payload && event.payload.text) || '').substr(0, MAX_CHAR_LEN)

export default class AnalyticsDb {
  knex: any

  constructor(bp: typeof sdk) {
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
      text: extractText(event),
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
      text: extractText(event),
      channel: event.channel,
      user_id: event.target,
      direction: 'out'
    }

    return this.knex('analytics_interactions').insert(interactionRow)
  }
}
