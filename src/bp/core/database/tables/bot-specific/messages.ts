import { Table } from 'core/database/interfaces'

export class MessagesTable extends Table {
  readonly name: string = 'messages'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id').primary()
      table
        .integer('conversationId')
        .unsigned()
        .references('id')
        .inTable('conversations')
        .notNullable()
        .onDelete('cascade')
      table.string('eventId')
      /*
        this whole thing can't work because the event is inserted after so the foreign key constraint fails
        .references('id')
        .inTable('events')
        .nullable()
        // not sure if this works
        .onDelete('set null')
        */
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
