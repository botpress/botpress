import { Table } from '../../interfaces'

export class NotificationsTable extends Table {
  name: string = 'srv_notifications'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists('notifications', table => {
      table.uuid('id').primary()
      table.string('botId')
      table.string('message')
      table.string('level')
      table.string('module_id')
      table.string('module_icon')
      table.string('module_name')
      table.string('redirect_url')
      table.timestamp('created_on')
      table.boolean('read')
      table.boolean('archived')

      table
        .foreign('botId')
        .references('id')
        .inTable('srv_bots')
      created = true
    })
    return created
  }
}
