import { Table } from '../interfaces'

export default class BotsTable extends Table {
  name: string = 'srv_bots'

  async bootstrap() {
    await this.knex
      .createTableIfNotExists(this.name, table => {
        table.increments('id')
        table.string('name')
        table.timestamps(true, true)
      })
      .then(() => {
        // This is test seeding
        return this.knex.insert({ id: 123, name: 'Test Bot' }).into('srv_bots')
      })
  }
}
