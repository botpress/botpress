import { Table } from '../../interfaces'

export default class DialogSessionTable extends Table {
  name: string = 'dialog_sessions'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('id').primary()
      table.text('state').nullable()
      table.text('context').notNullable()
      table.text('event').notNullable()
      table.timestamp('active_on').notNullable()
      table.timestamp('created_on').notNullable()
      table.timestamp('modified_on').notNullable()
      created = true
    })
    return created
  }
}
