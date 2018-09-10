import { Table } from '../../interfaces'

export default class AuthTeamsTable extends Table {
  name: string = 'auth_team_members'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table
        .integer('team')
        .references('auth_teams.id')
        .onDelete('CASCADE')
      table
        .integer('user')
        .references('auth_users.id')
        .onDelete('CASCADE')
      table
        .integer('role')
        .references('auth_roles.id')
        .onDelete('CASCADE')
      table.timestamps()
      created = true
    })
    return created
  }
}
