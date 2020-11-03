import { Table } from 'core/database/interfaces'

export class ChannelUsersTable extends Table {
  name: string = 'srv_channel_users'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('channel')
      table.string('user_id')
      table.json('attributes')
      table.timestamps(true, true)
      table.index(['channel', 'user_id'], 'scu_idx')
      created = true
    })
    return created
  }
}
