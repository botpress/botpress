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
        table.timestamps(true, true)
      })
      .then(created => {
        // TODO: Use knex seed api instead
        if (created) {
          return this.knex
            .insert({
              id: 123,
              name: 'Test Bot',
              version: '1.0.0',
              description: 'Just a test bot',
              author: 'Botpress',
              license: 'AGPL-3.0'
            })
            .into(this.name)
        }
      })
  }
}
