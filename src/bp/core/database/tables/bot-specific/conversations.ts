import { Table } from 'core/database/interfaces'

export class ConversationsTable extends Table {
  readonly name: string = 'conversations'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id').primary()
      table.string('userId')
      table.string('botId')
      table.string('title')
      table.string('description')
      table.string('logo_url')
      table.timestamp('created_on')
      table.timestamp('last_heard_on') // The last time the user interacted with the bot. Used for "recent" conversation
      table.timestamp('user_last_seen_on')
      table.timestamp('bot_last_seen_on')
      table.index(['userId', 'botId'], 'cub_idx')
      created = true
    })
    return created
  }
}
