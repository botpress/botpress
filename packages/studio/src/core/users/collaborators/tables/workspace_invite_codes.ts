import { Table } from 'core/database/interfaces'

export class WorkspaceInviteCodesTable extends Table {
  name: string = 'workspace_invite_codes'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('workspaceId')
      table.string('inviteCode')
      table.integer('allowedUsages')
      table.timestamps(true, true)
      created = true
    })
    return created
  }
}
