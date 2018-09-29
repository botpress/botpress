import _ from 'lodash'

import { SDK } from '.'

export default class AnalyticsDb {
  knex: any

  constructor(bp: SDK) {
    this.knex = bp.database
  }

  initializeDb = (bp: SDK) => {
    console.log('init')
    if (!this.knex) {
      throw new Error('you must initialize the database before')
    }

    return this.knex
      .createTableIfNotExists('analytics_interactions', table => {
        table.increments('id').primary()
        table.timestamp('ts')
        table.string('type')
        table.string('text')
        table.string('user').references('users.id')
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
          table.string('date')
          table.string('name')
          table.integer('count')
          table.unique(['date', 'name'])
        })
      })
      .then(() => this.knex)
  }

  saveIncoming = event => {
    let user =
      _.get(event, 'user.id') || _.get(event, 'user.userId') || _.get(event, 'raw.from') || _.get(event, 'user')

    if (!user.startsWith(event.platform)) {
      user = event.platform + ':' + user
    }

    const interactionRow = {
      ts: this.knex.knex.date.now(),
      type: event.type,
      text: event.text,
      user: user,
      direction: 'in'
    }

    return this.knex('analytics_interactions').insert(interactionRow)
  }

  saveOutgoing = event => {
    let userId =
      _.get(event, 'user.id') || _.get(event, 'user.userId') || _.get(event, 'raw.to') || _.get(event, 'user')

    if (!userId.startsWith(event.platform)) {
      userId = event.platform + ':' + userId
    }

    const interactionRow = {
      ts: this.knex.date.now(),
      type: event.type,
      text: event.text,
      user: userId,
      direction: 'out'
    }

    return this.knex('analytics_interactions')
      .insert(interactionRow)
      .then(function(result) {
        return true
      })
  }
}
