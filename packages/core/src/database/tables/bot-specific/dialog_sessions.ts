import { Table } from '../../interfaces'

export default class DialogSessionTable extends Table {
  name: string = 'dialog_sessions'

  async bootstrap() {
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('id').primary()
      table.text('state').nullable()
      table.text('context').notNullable()
      table.text('event').notNullable()
      table
        .timestamp('active_on')
        .notNullable()
        .defaultTo(this.knex.date.now())
      table
        .timestamp('created_on')
        .notNullable()
        .defaultTo(this.knex.date.now())
      table
        .timestamp('modified_on')
        .notNullable()
        .defaultTo(this.knex.date.now())
    })
  }
}
