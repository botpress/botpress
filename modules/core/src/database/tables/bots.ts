import { Table } from '../interfaces'

export default class BotsTable extends Table {
  name: string = 'srv_bots'

  bootstrap(): Promise<void> {
    return this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('name')
    })
  }
}
