import { Table } from 'core/database/interfaces'

export class AttributesTable extends Table {
  readonly name: string = 'attributes'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.uuid('entityId')
      table.string('attribute')
      table.string('value')
      table.primary(['entityId', 'attribute'])
      created = true
    })
    return created
  }
}
