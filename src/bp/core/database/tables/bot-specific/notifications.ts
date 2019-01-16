import { Table } from 'core/database/interfaces'

export class NotificationsTable extends Table {
  name: string = 'srv_notifications'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists('srv_notifications', table => {
      table
        .increments('id')
        .notNullable()
        .primary()
      table.string('botId').notNullable()
      table.string('message')
      table.string('level')
      table.string('module_id')
      table.string('module_icon')
      table.string('module_name')
      table.string('redirect_url')
      table.timestamp('created_on')
      table.boolean('read').defaultTo(false)
      table.boolean('archived').defaultTo(false)
      created = true
    })
    return created
  }
}
