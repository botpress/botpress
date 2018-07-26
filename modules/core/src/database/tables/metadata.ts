import { Table } from '../interfaces'

export default class ServerMetadataTable extends Table {
  name: string = 'srv_metadata'

  async bootstrap() {
    await this.knex.schema.createTableIfNotExists(this.name, table => {
      table.string('server_version')
      table.timestamps(true, true)
    })
  }
}
