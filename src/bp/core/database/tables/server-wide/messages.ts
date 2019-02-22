import { Table } from 'core/database/interfaces'

export class MessagesTable extends Table {
  name = 'web_messages'

  async bootstrap(): Promise<boolean> {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('id').primary()
      table.integer('conversationId')
      table.string('userId')
      table.string('message_type')
      table.text('message_text')
      table.jsonb('message_raw')
      table.jsonb('message_data') // Only useful if type = file
      table.string('full_name')
      table.string('avatar_url')
      table.timestamp('sent_on')
      created = true
    })

    return created
  }
}
