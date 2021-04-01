import { Table } from 'core/database/interfaces'

export class MappingTable extends Table {
  name: string = 'mapping'

  async bootstrap() {
    let created = false

    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('scope')
      table.string('foreign')
      table.string('local')
      table.primary(['scope', 'foreign', 'local'])
      table.unique(['scope', 'foreign'])
      table.unique(['scope', 'local'])
      created = true
    })
    return created
  }
}
