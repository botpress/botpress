module.exports = {
  up: async knex => {
    const hasColumn = await knex.schema.hasColumn('hitl_sessions', 'raw')

    if (!hasColumn) {
      return knex.schema.table('hitl_sessions', table => {
        table.json('raw')
      })
    }
  },
  down: async knex => {
    const hasColumn = await knex.schema.hasColumn('hitl_sessions', 'raw')

    if (hasColumn) {
      return knex.schema.table('hitl_sessions', table => {
        table.dropColumn('raw')
      })
    }
  }
}
