import { Table } from '../../interfaces'

export default class DialogSessionTable extends Table {
  name: string = 'dialog_sessions'

  async bootstrap() {
    await this.knex.createTableIfNotExists(this.name, table => {
      table.string('id').primary()
      table.text('state')
      table.text('context')
      table.timestamp('active_on')
      table.text('created_on')
      table.text('modified_on')
    })
  }
}
