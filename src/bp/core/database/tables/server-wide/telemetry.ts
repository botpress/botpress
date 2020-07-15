import { Table } from 'core/database/interfaces'

export class TelemetryTable extends Table {
  name: string = 'telemetry'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.uuid('uuid').notNullable()
      table.json('payload').notNullable()
      table.boolean('available').notNullable()
      table.timestamp('lastChanged').notNullable()
      table.timestamp('creationDate').notNullable()
      created = true
    })
    return created
  }
}
