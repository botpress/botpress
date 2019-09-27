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

export type TableRow = {
  messageId: string
  reason: FLAG_REASON
  status: FLAGED_MESSAGE_STATUS
}

const BATCH_SIZE_LIMIT = 30

export default class Db {
  knex: any

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
  }

  async initialize() {
    this.knex.createTableIfNotExists(TABLE_NAME, table => {
      table.string('messageId').primary()
      table.string('language')
      table.enum('reason', ['auto_hook', 'action', 'manual'])
      table.enum('status', ['new', 'handled', 'deleted']).default('new')
    })
  }

  async flagMessages(messageIds: string[]) {
    const existingRows = await this.knex
      .select()
      .from(TABLE_NAME)
      .whereIn('messageId', messageIds)
      .then((rows: TableRow[]) => rows.map(r => r.messageId))

    const newRows = messageIds.filter(msgId => !existingRows.includes(msgId)).map(msgId => ({ messageId: msgId }))

    await this.knex.batchInsert(TABLE_NAME, newRows, BATCH_SIZE_LIMIT)
  }

  async updateStatus(messageId: string, status: FLAGED_MESSAGE_STATUS) {
    await this.knex.where({ messageId }).update({ status })
  }
}
