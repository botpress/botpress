import { Table } from 'core/database/interfaces'

export class MessagesTable extends Table {
  readonly name: string = 'messages'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.uuid('id').primary()
      table
        .uuid('conversationId')
        .references('id')
        .inTable('conversations')
        .notNullable()
        .onDelete('cascade')
      table.string('eventId')
      table.string('incomingEventId')
      table.string('from')
      table.timestamp('sentOn')
      table.jsonb('payload')
      table.index(['conversationId', 'sentOn'], 'mcs_idx')
      created = true
    })
    return created
  }
}
