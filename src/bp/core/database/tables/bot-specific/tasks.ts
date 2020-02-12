import { Table } from 'core/database/interfaces'

export class TasksTable extends Table {
  name: string = 'tasks'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('eventId').notNullable()
      table.string('status').notNullable()
      table.string('actionName').notNullable()
      table.json('actionArgs')
      table.string('actionServer')
      table.boolean('trusted').notNullable()
      table.string('response_status_code')
      table.timestamp('response_received_at')
      table.timestamps(true, true)
      created = true
    })
    return created
  }
}
