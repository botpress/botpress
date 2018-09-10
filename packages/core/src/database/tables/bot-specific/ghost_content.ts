import { Table } from '../../interfaces'

export default class ServerMetadataTable extends Table {
  readonly name: string = 'srv_ghost_files'
  readonly filesTable: string = this.name
  readonly indexTable: string = 'srv_ghost_index'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.filesTable, table => {
      table.increments('id')
      table.string('botId')
      // .references('id') // TODO FIXME Enable that when we have support for the multi-bots
      // .inTable('srv_bots')
      // .onDelete('CASCADE')
      table.string('file_path')
      table.binary('content_binary')
      table.text('content_text')
      table.timestamp('modified_on').defaultTo(this.knex.date.now())
    })

    await this.knex.createTableIfNotExists(this.indexTable, table => {
      table.increments('id')
      table
        .integer('content_id')
        .references('id')
        .inTable(this.filesTable)
        .onDelete('CASCADE')
      table.string('revision')
      table.string('botId')
      // .references('id') // TODO FIXME Enable that when we have support for the multi-bots
      // .inTable('srv_bots')
      // .onDelete('CASCADE')
      table.timestamp('modified_on').defaultTo(this.knex.date.now())
      table.string('created_by')
      created = true
    })

    return created
  }
}
