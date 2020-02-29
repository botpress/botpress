import { Table } from 'core/database/interfaces'

export class TasksTable extends Table {
  name: string = 'tasks'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('event_id').notNullable()
      table.string('status').notNullable()
      table.string('action_name').notNullable()
      table.json('action_args').notNullable()
      table.string('action_server_id').notNullable()
      table.integer('status_code')
      table.timestamp('started_at').notNullable()
      table.timestamp('ended_at').notNullable()
      table.string('failure_reason')
      created = true
    })
    return created
  }
}
