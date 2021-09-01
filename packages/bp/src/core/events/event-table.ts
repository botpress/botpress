import { Table } from 'core/database/interfaces'

export class EventsTable extends Table {
  name: string = 'events'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('id').primary()
      table.uuid('messageId').nullable()
      table.string('botId').notNullable()
      table.string('channel').notNullable()
      table.string('threadId').nullable()
      table.string('target').nullable()
      table.string('sessionId').nullable()
      table.string('type').nullable()
      table.string('direction').notNullable()
      table.string('incomingEventId').nullable()
      table.string('workflowId').nullable()
      table.integer('feedback').nullable()
      table.boolean('success').nullable()
      table.json('event').notNullable()
      table.timestamp('createdOn').notNullable()
      table.index('createdOn', 'events_idx')
      table.index('messageId')
      created = true
    })
    return created
  }
}
