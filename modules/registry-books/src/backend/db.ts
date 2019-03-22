export default class Database {
  knex: any

  constructor(private bp: SDK) {
    this.knex = bp.database
  }

  initialize() {
    if (!this.knex) {
      throw new Error('You must initialize the database before')
    }

    this.knex
      .createTableIfNotExists('registry_books', function (table) {
        table.increments('id').unsigned().primary()
        // Id from the Bot
        table.string('botId')
        // Registry category
        table.string('category')
        // Used to internaly check if the data is equal
        table.text('data_key')
        // Data Stored
        table.text('data')
        // Date in which the data was stored
        table.date('registered_on')
        // How many times this data was stored (same category and date)
        table.integer('hit_count')
      })
      .then(() => this.knex)
  }
}