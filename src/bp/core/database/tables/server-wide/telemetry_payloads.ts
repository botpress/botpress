import { Table } from 'core/database/interfaces'

export class TelemetryPayloadTable extends Table {
  name: string = 'telemetry_payloads'

  async bootstrap() {
    let created = false

    // await this.knex.schema.dropTable('telemetry_payloads')

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
