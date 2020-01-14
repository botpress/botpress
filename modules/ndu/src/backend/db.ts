import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { NduLog } from './typings'

export default class Database {
  knex: any

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
  }

  async initialize() {
    return this.knex.createTableIfNotExists('ndu_logs', function(table) {
      table.increments('id').primary()
      table.string('target')
      table.string('text')
      table.string('currentGoal')
      table.string('currentGoalId')
      table.string('nextGoal')
      table.jsonb('triggers')
      table.string('result')
      table.timestamp('created_on')
    })
  }

  async appendEvent(event: NduLog) {
    return this.knex('ndu_logs').insert({ ...event, triggers: this.knex.json.set(event.triggers || {}) })
  }

  async listElements() {
    const rows = await this.knex('ndu_logs')
      .select('*')
      .limit(100)

    return rows.map(row => ({
      ...row,
      triggers: this.knex.json.get(row.triggers)
    }))
  }
}
