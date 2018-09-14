import { Table } from '../../interfaces'

export class AuthUsersTable extends Table {
  name: string = 'auth_users'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table
        .string('username')
        .unique()
        .notNullable() // validate: { len: [3, 30] }
      table.string('password')
      table.string('firstname')
      table.string('lastname')
      table.string('picture')
      table.string('company')
      table.string('last_ip')
      table.string('email') // validate: { isEmail: true }
      table.string('remote_id').notNullable()
      table.string('provider').notNullable()
      table.unique(['remote_id', 'provider'])
      table.string('location')
      table.timestamps()
      table.timestamp('last_synced_at')
      created = true
    })
    return created
  }
}
