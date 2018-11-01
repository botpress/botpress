import { Table } from 'core/database/interfaces'
import Knex from 'knex'

const insertMembers = async (knex: Knex, tableName: string) => {
  return knex
    .batchInsert(
      tableName,
      [1].map(userId => ({
        id: userId,
        team: 1,
        user: userId,
        role: userId === 1 ? 1 : 2 // 1 for owner, 2 for admin
      }))
    )
    .then()
}

export class AuthTeamMembersTable extends Table {
  name: string = 'auth_team_members'

  bootstrap() {
    return this.knex
      .createTableIfNotExists(this.name, table => {
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
        table.timestamps(true, true)
      })
      .then(async created => {
        if (created) {
          await insertMembers(this.knex, this.name)
        }
        return created
      })
  }
}
