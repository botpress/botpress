import { ExtendedKnex } from 'botpress-module-sdk'

import { Table } from '../../interfaces'

const insertMembers = async (knex: ExtendedKnex, tableName: string) => {
  return knex
    .batchInsert(
      tableName,
      [1, 2, 3].map(userId => ({
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
        table.timestamps()
      })
      .then(async created => {
        if (created) {
          await insertMembers(this.knex, this.name)
        }
        return created
      })
  }
}
