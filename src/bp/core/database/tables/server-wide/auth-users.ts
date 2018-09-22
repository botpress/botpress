import { ExtendedKnex } from 'botpress-module-sdk'
import _ from 'lodash'

import { calculateHash } from '../../../services/auth/util'
import { Table } from '../../interfaces'

const USERS = ['admin', 'sylvain', 'renaud']
const PASSWORD = '123456'

const insertUsers = async (knex: ExtendedKnex, tableName: string) => {
  return knex
    .batchInsert(
      tableName,
      USERS.map((username, index) => ({
        id: index + 1,
        username,
        password: calculateHash(PASSWORD),
        firstname: username,
        lastname: username
      }))
    )
    .then()
}

export class AuthUsersTable extends Table {
  name: string = 'auth_users'

  bootstrap() {
    return this.knex
      .createTableIfNotExists(this.name, table => {
        table.increments('id')
        table
          .string('username')
          .unique()
          .notNullable() // validate: { len: [3, 30] }
        table.string('password').notNullable()
        table.string('firstname')
        table.string('lastname')
        table.string('picture')
        table.string('company')
        table.string('last_ip')
        table.string('email') // validate: { isEmail: true }
        table.string('location')
        table.timestamps(true, true)
      })
      .then(async created => {
        if (created) {
          await insertUsers(this.knex, this.name)
        }
        return created
      })
  }
}
