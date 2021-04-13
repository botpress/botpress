import { Table } from 'core/database/interfaces'

export class GhostFilesTable extends Table {
  readonly name: string = 'srv_ghost_files'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('file_path').primary()
      table.binary('content')
      table.boolean('deleted')
      table.timestamp('modified_on')
      created = true
    })
    return created
  }
}
