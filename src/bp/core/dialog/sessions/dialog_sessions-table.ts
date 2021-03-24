import { Table } from 'core/database/interfaces'

export class DialogSessionTable extends Table {
  name: string = 'dialog_sessions'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.text('id').notNullable()
      table.json('context').notNullable()
      table.json('temp_data').notNullable()
      table.json('session_data').notNullable()
      table.timestamp('context_expiry').nullable()
      table.timestamp('session_expiry').nullable()
      table.timestamp('created_on').notNullable()
      table.timestamp('modified_on').notNullable()
      table.primary(['id'])
      created = true
    })
    return created
  }
}
