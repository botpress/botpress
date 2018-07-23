import { Table } from '../interfaces'

export default class ServerMetadataTable extends Table {
  Name: string = 'srv_metadata'

  async bootstrap() {
    await this._knex.schema.createTableIfNotExists(this.Name, table => {
      table.string('server_version')
      table.timestamp('created_on')
    })
  }

}