import { Table } from 'core/database/interfaces'

export class MigrationsTable extends Table {
  name: string = 'knex_core_migrations'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('name')
      table.integer('batch')
      table.timestamp('migrated_time')
      created = true
    })
    return created
  }
}
