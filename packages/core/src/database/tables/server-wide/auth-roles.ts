import { Table } from '../../interfaces'

export default class AuthRolesTable extends Table {
  name: string = 'auth_roles'

  async bootstrap() {
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table
        .string('name')
        .unique()
        .notNullable()
      table.text('description')
      table.json('rules').notNullable()
      table
        .integer('team')
        .references('auth_teams.id')
        .onDelete('CASCADE')
    })
  }
}
