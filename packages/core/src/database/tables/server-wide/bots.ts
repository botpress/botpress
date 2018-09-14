import { ExtendedKnex } from 'botpress-module-sdk'

import { Table } from '../../interfaces'

// TODO: Use knex seed api instead
const insertBots = async (knex: ExtendedKnex, tableName: string) => {
  return knex
    .batchInsert(tableName, [
      {
        id: 123,
        name: 'Bot bot_123',
        version: '1.0.0',
        description: 'Just a test bot',
        author: 'Botpress',
        license: 'AGPL-3.0'
      }
    ])
    .then()
}

export class BotsTable extends Table {
  name: string = 'srv_bots'

  async bootstrap() {
    return this.knex
      .createTableIfNotExists(this.name, table => {
        table.increments('id')
        table.string('name')
        table.string('version')
        table.string('description')
        table.string('author')
        table.string('license')
        table.timestamps(true, true)
        table
          .integer('team')
          .references('auth_teams.id')
          .onDelete('SET NULL')
      })
      .then(async created => {
        if (created) {
          await insertBots(this.knex, this.name)
        }
        return created
      })
  }
}
