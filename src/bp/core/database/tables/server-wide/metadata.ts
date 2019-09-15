import { Table } from 'core/database/interfaces'

export class ServerMetadataTable extends Table {
  name: string = 'srv_metadata'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('server_version')
      table.timestamps(true, true)
      created = true
    })
    return created
  }
}
