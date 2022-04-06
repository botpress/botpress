import { Table } from 'core/database/interfaces'

export class ChannelsTable extends Table {
  readonly name: string = 'srv_channels'

  async bootstrap() {
    let created = false
    await this.knex.createTableIfNotExists(this.name, table => {
      table
        .uuid('clientId')
        .primary()
        .notNullable()
      table
        .string('botId')
        .unique()
        .notNullable()
      table.string('clientToken').notNullable()
      table.jsonb('config').notNullable()
      created = true
    })
    return created
  }
}
