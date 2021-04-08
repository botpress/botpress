import { Table } from 'core/database/interfaces'

export class AttributesTable extends Table {
  readonly name: string = 'attributes'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.uuid('entity')
      table.string('attribute')
      table.string('value').notNullable()
      table.primary(['entity', 'attribute'])
      created = true
    })
    return created
  }
}
