import { Table } from 'core/database/interfaces'

export class BotUsersTable extends Table {
  name: string = 'bot_chat_users'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('botId').notNullable()
      table.string('channel').notNullable()
      table.string('userId').notNullable()
      table.primary(['botId', 'channel', 'userId'])

      table
        .timestamp('createdOn')
        .notNullable()
        .defaultTo(this.knex.fn.now())
      table
        .timestamp('lastSeenOn')
        .notNullable()
        .defaultTo(this.knex.fn.now())
      created = true
    })
    return created
  }
}
