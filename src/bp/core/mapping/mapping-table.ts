import { Table } from 'core/database/interfaces'

export class MappingTable extends Table {
  name: string = 'mapping'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('scope')
      table.uuid('local')
      table.string('foreign')
      table.primary(['scope', 'local', 'foreign'])
      table.unique(['scope', 'local'])
      table.unique(['scope', 'foreign'])
      created = true
    })
    return created
  }
}
