import { Table } from 'core/database/interfaces'

export class BotsTable extends Table {
  name: string = 'srv_bots'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table
        .string('id')
        .notNullable()
        .unique()
      table.string('name')
      table.string('version')
      table.string('description')
      table.string('author')
      table.string('license')
      table.timestamps(true, true)
      table
        .integer('team')
        .references('auth_teams.id')
        .onDelete('SET NULL')
      created = true
    })

    return created
  }
}
