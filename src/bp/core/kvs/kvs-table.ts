import { Table } from 'core/database/interfaces'

export class KeyValueStoreTable extends Table {
  readonly name: string = 'srv_kvs'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('key')
      table.text('value').notNullable()
      table.string('botId').notNullable()
      table.timestamp('expireOn').nullable()
      table.timestamp('modified_on')
      table.primary(['key', 'botId'])
      created = true
    })
    return created
  }
}
