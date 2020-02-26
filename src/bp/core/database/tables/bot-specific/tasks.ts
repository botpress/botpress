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
      table.json('actionArgs').notNullable()
      table.string('actionServerId').notNullable()
      table.string('responseStatusCode')
      table.timestamp('responseReceivedAt')
      table.timestamps(true, true)
      created = true
    })
    return created
  }
}
