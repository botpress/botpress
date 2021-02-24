import { Table } from 'core/database/interfaces'

export class ConversationsTable extends Table {
  readonly name: string = 'conversations'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.uuid('id').primary()
      // TODO reference future users table
      table.string('userId')
      table.string('botId')
      table.timestamp('createdOn')
      table.index(['userId', 'botId'], 'cub_idx')
      created = true
    })
    return created
  }
}
