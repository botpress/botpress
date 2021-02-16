export class StrategyUserTable {
  async createStrategyTable(knex, tableName: string) {
    let created = false
    await knex.createTableIfNotExists(tableName, table => {
      table.increments('id')
      table.string('email').notNullable()
      table.string('password').nullable()
      table.string('salt').nullable()
      table.string('strategy').notNullable()
      table.json('attributes').notNullable()
      table
        .integer('tokenVersion')
        .notNullable()
        .defaultTo(1)
      table.timestamps(true, true)
      created = true
    })

    return created
  }
}
