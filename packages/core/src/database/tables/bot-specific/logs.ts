import { Table } from '../../interfaces'

export class LogsTable extends Table {
  name: string = 'srv_logs'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('botId')
      table.string('timestamp')
      table.string('level')
      table.string('scope')
      table.text('message')
      table.text('metadata')
      table
        .foreign('botId')
        .references('id')
        .inTable('srv_bots')
      created = true
    })
    return created
  }
}
