import * as sdk from 'botpress/sdk'

const TABLE_NAME = 'misunderstood'

export enum FLAGED_MESSAGE_STATUS {
  new = 'new',
  handled = 'handled',
  deleted = 'deleted'
}

export enum FLAG_REASON {
  auto_hook = 'auto_hook',
  action = 'action',
  manual = 'manual'
}

export type FlaggedEvent = {
  eventId: string
  botId: string
  language: string
  reason: FLAG_REASON
  status: FLAGED_MESSAGE_STATUS
}

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
      table.enum('reason', ['auto_hook', 'action', 'manual'])
      table.enum('status', ['new', 'handled', 'deleted']).default('new')
    })
  }

  async addEvent(event: FlaggedEvent) {
    await this.knex(TABLE_NAME).insert(event)
  }

  async updateStatus(botId: string, id: string, status: FLAGED_MESSAGE_STATUS) {
    await this.knex(TABLE_NAME)
      .where({ botId, id })
      .update({ status })
  }

  listEvents(botId: string, status: FLAGED_MESSAGE_STATUS) {
    return this.knex(TABLE_NAME)
      .select('*')
      .where({ botId, status })
      .then()
  }

  countEvents(botId: string) {
    return this.knex(TABLE_NAME)
      .where({ botId })
      .count('id', { as: 'count' })
      .groupBy('status')
      .then((data: { count: number; status: string }[]) =>
        data.reduce((acc, row) => {
          acc[row.status] = row.count
          return acc
        }, {})
      )
  }
}
