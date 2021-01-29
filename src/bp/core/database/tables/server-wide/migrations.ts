import { Table } from 'core/database/interfaces'

export class MigrationsTable extends Table {
  name: string = 'srv_migrations'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('initialVersion')
      table.string('targetVersion')
      table.text('details')
      table.timestamps(true, true)
      created = true
    })
    return created
  }
}
