import { Table } from 'core/database/interfaces'

export class ChannelUsersTable extends Table {
  name: string = 'srv_channel_users'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('channel')
      table.string('user_id')
      table.text('attributes')
      table.timestamps(true, true)
      created = true
    })
    return created
  }
}
