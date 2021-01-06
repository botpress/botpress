import { Table } from 'core/database/interfaces'

export class MessagesTable extends Table {
  readonly name: string = 'messages'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('id').primary()
      table.integer('conversationId')
      table.string('incomingEventId')
      table.string('eventId')
      table.string('userId')
      table.string('message_type') // @ deprecated Remove in a future release (11.9)
      table.text('message_text') // @ deprecated Remove in a future release (11.9)
      table.jsonb('message_raw') // @ deprecated Remove in a future release (11.9)
      table.jsonb('message_data') // @ deprecated Remove in a future release (11.9)
      table.jsonb('payload')
      table.string('full_name')
      table.string('avatar_url')
      table.timestamp('sent_on')
      table.index(['conversationId', 'sent_on'], 'mcs_idx')
      created = true
    })
    await this.knex.raw(
      `CREATE INDEX IF NOT EXISTS mcms_idx ON messages ("conversationId", message_type, sent_on DESC) WHERE message_type != 'visit';`
    )
    return created
  }
}
