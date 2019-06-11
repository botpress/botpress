import { Table } from 'core/database/interfaces'

export class MigrationsModules extends Table {
  name: string = 'knex_module_migrations'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('name')
      table.integer('batch')
      table.timestamp('migration_time')
      created = true
    })

    return created
  }
}
