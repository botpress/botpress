import { Table } from '../../interfaces'

export class KeyValueStoreTable extends Table {
  readonly name: string = 'srv_kvs'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('key').primary()
      table.text('value').notNullable()
      table
        .string('botId')
        .references('id')
        .inTable('srv_bots')
        .onDelete('CASCADE')
      table.timestamp('modified_on')
      created = true
    })
    return created
  }
}
