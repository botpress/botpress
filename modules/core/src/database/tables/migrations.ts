import { Table } from '../interfaces'

export default class MigrationsTable extends Table {
  name: string = 'knex_core_migrations'

  async bootstrap() {
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('name')
      table.integer('batch')
      table.timestamp('migrated_time')
    })
  }
}
