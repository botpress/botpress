import { Table } from '../interfaces'

export default class BotsTable extends Table {
  name: string = 'srv_bots'

  async bootstrap() {
    return this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('name')
      table.timestamps()
    })
  }
}
