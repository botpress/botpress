import * as sdk from 'botpress/sdk'

import {
  DbFlaggedEvent,
  FLAG_REASON,
  FLAGGED_MESSAGE_STATUS,
  FLAGGED_MESSAGE_STATUSES,
  FlaggedEvent,
  RESOLUTION_TYPE,
  ResolutionData
} from '../types'

const TABLE_NAME = 'misunderstood'

export default class Db {
  knex: any

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
  }

  async initialize() {
    this.knex.createTableIfNotExists(TABLE_NAME, table => {
      table.increments('id')
      table.string('eventId')
      table.string('botId')
      table.string('language')
      table.string('preview')
      table.enum('reason', Object.values(FLAG_REASON))
      table.enum('status', FLAGGED_MESSAGE_STATUSES).default(FLAGGED_MESSAGE_STATUS.new)
      table.enum('resolutionType', Object.values(RESOLUTION_TYPE))
      table.string('resolution')
      table.json('resolutionParams')
      table.timestamp('createdAt').defaultTo(this.knex.fn.now())
      table.timestamp('updatedAt').defaultTo(this.knex.fn.now())
    })
  }

  async addEvent(event: FlaggedEvent) {
    await this.knex(TABLE_NAME).insert(event)
  }

  async updateStatus(botId: string, id: string, status: FLAGGED_MESSAGE_STATUS, resolutionData?: ResolutionData) {
    if (status !== FLAGGED_MESSAGE_STATUS.pending) {
      resolutionData = { resolutionType: null, resolution: null, resolutionParams: null }
    }

    await this.knex(TABLE_NAME)
      .where({ botId, id })
      .update({ status, ...resolutionData, updatedAt: this.knex.fn.now() })
  }

  listEvents(botId: string, language: string, status: FLAGGED_MESSAGE_STATUS): DbFlaggedEvent[] {
    return this.knex(TABLE_NAME)
      .select('*')
      .where({ botId, language, status })
      .orderBy('updatedAt', 'desc')
      .then()
  }

  countEvents(botId: string, language: string) {
    return this.knex(TABLE_NAME)
      .where({ botId, language })
      .select('status')
      .count({ count: 'id' })
      .groupBy('status')
      .then((data: { count: number; status: string }[]) =>
        data.reduce((acc, row) => {
          acc[row.status] = Number(row.count)
          return acc
        }, {})
      )
  }

  getEventDetails(botId: string, id: string) {
    return this.knex(TABLE_NAME)
      .where({ botId, id })
      .limit(1)
      .select('*')
      .then((data: DbFlaggedEvent[]) => (data && data.length ? data[0] : null))
  }
}
