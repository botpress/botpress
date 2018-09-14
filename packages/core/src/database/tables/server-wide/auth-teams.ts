import { ExtendedKnex } from 'botpress-module-sdk'

import { Table } from '../../interfaces'

const insertTeams = async (knex: ExtendedKnex, tableName: string) => {
  return knex
    .batchInsert(tableName, [
      {
        id: 1,
        name: 'Test Team',
        invite_code: 'test_code'
      }
    ])
    .then()
}

export class AuthTeamsTable extends Table {
  name: string = 'auth_teams'

  bootstrap() {
    return this.knex
      .createTableIfNotExists(this.name, table => {
        table.increments('id')
        table.string('name').notNullable() // validate: { len: [3, 30] }
        table.string('invite_code').notNullable()
      })
      .then(async created => {
        if (created) {
          await insertTeams(this.knex, this.name)
        }
        return created
      })
  }
}
