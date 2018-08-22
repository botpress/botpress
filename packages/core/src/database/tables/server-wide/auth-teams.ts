import { Table } from '../../interfaces'

export default class AuthTeamsTable extends Table {
  name: string = 'auth_teams'

  async bootstrap() {
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table
        .string('name')
        .unique()
        .notNullable() // validate: { len: [3, 30] }
      table.string('invite_code').notNullable()
    })
  }
}
