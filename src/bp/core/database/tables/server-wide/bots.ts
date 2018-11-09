import { container } from 'core/app.inversify'
import { Table } from 'core/database/interfaces'
import Knex from 'knex'

import { TYPES } from '../../../types'

// TODO: Use knex seed api instead
const insertBots = async (knex: Knex, tableName: string) => {
  return knex
    .batchInsert(tableName, [
      {
        id: 'welcome-bot',
        name: 'Welcome Bot',
        version: '1.0.0',
        description: 'Welcome Bot',
        author: 'Botpress, Inc.',
        license: 'AGPL-3.0',
        team: 1
      }
    ])
    .then()
}

export class BotsTable extends Table {
  name: string = 'srv_bots'

  async bootstrap() {
    return this.knex
      .createTableIfNotExists(this.name, table => {
        table
          .string('id')
          .notNullable()
          .unique()
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
        const isDevelopment = !container.get<boolean>(TYPES.IsProduction)
        if (isDevelopment && created) {
          await insertBots(this.knex, this.name)
        }
        return created
      })
  }
}
