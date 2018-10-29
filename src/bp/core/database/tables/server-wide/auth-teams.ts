import Knex from 'knex'

import { Table } from 'core/database/interfaces'

const insertTeams = async (knex: Knex, tableName: string) => {
  return knex.batchInsert(tableName, [
    {
      name: 'My Team'
    }
  ])
}

export class AuthTeamsTable extends Table {
  name: string = 'auth_teams'

  bootstrap() {
    return this.knex
      .createTableIfNotExists(this.name, table => {
        table.increments('id')
        table.string('name').notNullable() // validate: { len: [3, 30] }
      })
      .then(async created => {
        if (created) {
          await insertTeams(this.knex, this.name)
        }
        return created
      })
  }
}
