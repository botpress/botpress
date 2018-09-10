import { Table } from '../../interfaces'

export default class DialogSessionTable extends Table {
  name: string = 'dialog_sessions'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('id').primary()
      table.string('botId').notNullable()
      table.text('state').nullable()
      table.text('context').notNullable()
      table.text('event').notNullable()
      table.timestamp('active_on').notNullable()
      table.timestamp('created_on').notNullable()
      table.timestamp('modified_on').notNullable()
      table
        .foreign('botId')
        .references('id')
        .inTable('srv_bots')
      created = true
    })
    return created
  }
}
