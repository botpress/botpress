import { Table } from 'core/database/interfaces'

export class EventsTable extends Table {
  name: string = 'events'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id').primary()
      table.string('botId').notNullable()
      table.string('channel').notNullable()
      table.string('threadId').nullable()
      table.string('target').nullable()
      table.string('sessionId').nullable()
      table.string('direction').notNullable()
      table.string('incomingEventId').nullable()
      table.json('event').notNullable()
      table.timestamp('createdOn').notNullable()
      created = true
    })
    return created
  }
}
