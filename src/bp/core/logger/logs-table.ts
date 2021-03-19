import { Table } from 'core/database/interfaces'

export class LogsTable extends Table {
  name: string = 'srv_logs'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('botId').nullable()
      table.string('hostname').nullable()
      table.timestamp('timestamp')
      table.string('level')
      table.string('scope')
      table.text('message')
      table.text('metadata')
      table.index(['botId', 'timestamp'], 'sld_idx')
      created = true
    })
    return created
  }
}
