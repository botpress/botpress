import { Table } from 'bp/core/database/interfaces'

export class LogsTable extends Table {
  name: string = 'srv_logs'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table
        .string('botId')
        .nullable()
        .references('id')
        .inTable('srv_bots')
        .onDelete('CASCADE')
      table.string('timestamp')
      table.string('level')
      table.string('scope')
      table.text('message')
      table.text('metadata')
      created = true
    })
    return created
  }
}
