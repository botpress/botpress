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
        .date('createdOn')
        .notNullable()
        .defaultTo(this.knex.date.today())
      table
        .date('lastSeenOn')
        .notNullable()
        .defaultTo(this.knex.date.today())
      created = true
    })
    return created
  }
}
