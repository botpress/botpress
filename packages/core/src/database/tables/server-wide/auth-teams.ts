import { Table } from '../../interfaces'

export default class AuthTeamsTable extends Table {
  name: string = 'auth_teams'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.increments('id')
      table.string('name').notNullable() // validate: { len: [3, 30] }
      table.string('invite_code').notNullable()
      created = true
    })
    return created
  }
}
