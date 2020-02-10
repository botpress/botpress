import { Table } from 'core/database/interfaces'

export class AnalyticsTable extends Table {
  name: string = 'srv_analytics'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id').primary()
      table.string('botId')
      table.string('metric_name')
      table.string('channel')
      table.timestamp('created_on')
      table.timestamp('updated_on')
      table.decimal('value')
      created = true
    })

    return created
  }
}
