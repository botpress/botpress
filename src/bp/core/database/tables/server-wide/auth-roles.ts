import defaultRoles from '../../../services/auth/default-roles'
import { Table } from '../../interfaces'
import Knex from 'knex'

const insertRoles = async (knex: Knex, tableName: string) => {
  return knex
    .batchInsert(
      tableName,
      defaultRoles.map((role, index) => {
        return { ...role, id: index + 1, team: 1, rules: JSON.stringify(role.rules) }
      })
    )
    .then()
}

export class AuthRolesTable extends Table {
  name: string = 'auth_roles'

  bootstrap() {
    return this.knex
      .createTableIfNotExists(this.name, table => {
        table.increments('id')
        table.string('name').notNullable()
        table.text('description')
        table.json('rules').notNullable()
        table
          .integer('team')
          .references('auth_teams.id')
          .onDelete('CASCADE')
        table.unique(['team', 'name'])
        table.timestamps(true, true)
      })
      .then(async created => {
        if (created) {
          await insertRoles(this.knex, this.name)
        }
        return created
      })
  }
}
