import { Table } from '../interfaces'

export default class MigrationsTable extends Table {
  Name: string = 'knex_core_migrations'

  async bootstrap() {
    await this._knex.schema.createTableIfNotExists(this.Name, table => {
      table.increments('id')
      table.string('name')
      table.integer('batch')
      table.timestamp('migrated_time')
    })
  }
}
