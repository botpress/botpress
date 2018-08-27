import { Table } from '../../interfaces'

export default class BotsTable extends Table {
  name: string = 'srv_bots'

  async bootstrap() {
    await this.knex
      .createTableIfNotExists(this.name, table => {
        table.increments('id')
        table.string('name')
        table.string('version')
        table.string('description')
        table.string('author')
        table.string('license')
        table
          .string('public_id')
          .unique()
          .notNullable() //  validate: { len: [8, 20] }
        table.timestamps(true, true)
        table
          .integer('team')
          .references('auth_teams.id')
          .onDelete('SET NULL')
      })
      .then(created => {
        // TODO: Use knex seed api instead
        if (created) {
          return this.knex
            .insert({
              id: 123,
              name: 'Bot bot_123',
              version: '1.0.0',
              description: 'Just a test bot',
              author: 'Botpress',
              license: 'AGPL-3.0',
              public_id: 'bot_123'
            })
            .into(this.name)
        }
      })
  }
}
