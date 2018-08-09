import { Table } from '../../interfaces'

export default class DialogSessionTable extends Table {
  name: string = 'dialog_sessions'

  async bootstrap() {
    await this.knex
      .createTableIfNotExists(this.name, table => {
        table.increments('id')
        table.string('namespace')
        table.text('state')
        table.timestamp('active_on')
        table.timestamps(true, true)
      })
      .then()
  }
}
