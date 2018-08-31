import { Table } from '../../interfaces'

export default class ChannelUsersTable extends Table {
  name: string = 'srv_channel_users'

  async bootstrap() {
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('channel')
      table.string('userId')
      table.text('attributes')
      table.timestamps(true, true)
    })
  }
}
