import { Table } from 'core/database/interfaces'

export class GhostRevisionsTable extends Table {
  readonly name: string = 'srv_ghost_index'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('file_path')
      table.string('revision')
      table.string('created_by')
      table.timestamp('created_on')
      table.primary(['file_path', 'revision'])
      created = true
    })

    return created
  }
}
