import { Table } from '../../interfaces'

export default class AuthRolesTable extends Table {
  name: string = 'auth_roles'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description')
      table.json('rules').notNullable()
      table
        .integer('team')
        .references('auth_teams.id')
        .onDelete('CASCADE')
      table.unique(['team', 'name'])
      table.timestamps()
      created = true
    })
    return created
  }
}
