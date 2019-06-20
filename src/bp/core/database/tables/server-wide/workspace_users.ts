import { Table } from 'core/database/interfaces'

export class WorkspaceUsersTable extends Table {
  name: string = 'workspace_users'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('email')
      table.string('strategy')
      table.string('workspace')
      table.string('role')
      created = true
    })
    return created
  }
}
