import { Table } from 'core/database/interfaces'

export class MigrationsTable extends Table {
  name: string = 'knex_core_migrations'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('name')
      table.integer('batch')
      table.timestamp('migration_time')
      created = true
    })

    // NOTE: It will be removed in v12
    const hasIncorrectColumn = await this.knex.schema.hasColumn(this.name, 'migrated_time')

    if (hasIncorrectColumn) {
      await this.knex.schema.alterTable('knex_core_migrations', function (table) {
        table.renameColumn('migrated_time', 'migration_time')
      })
    }

    return created
  }
}
