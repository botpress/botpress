import { Table } from 'core/database/interfaces'

export class DataRetentionTable extends Table {
  name: string = 'data_retention'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.text('channel').notNullable()
      table.text('user_id').notNullable()
      table.text('field_path').notNullable()
      table.timestamp('expiry_date').notNullable()
      table.timestamp('created_on').notNullable()
      created = true
    })
    return created
  }
}
