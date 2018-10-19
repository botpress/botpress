const table = 'hitl_messages'
const { DatabaseHelpers: helpers } = require('botpress')

const alertSQLTextString = async (knex, length) =>
  helpers(knex) // sqlite doesn't support "alterColumn" https://www.sqlite.org/omitted.html
    .createTableIfNotExists('tmp_hitl_messages', function(table) {
      table.increments('id').primary()
      table
        .integer('session_id')
        .references('hitl_sessions.id')
        .onDelete('CASCADE')
      table.string('type')
      table.string('text', length)
      table.jsonb('raw_message')
      table.enu('direction', ['in', 'out'])
      table.timestamp('ts')
    })
    .then(async () => {
      await knex.raw('INSERT INTO tmp_hitl_messages SELECT * FROM hitl_messages')
      await knex.schema.dropTable(table)
      await knex.raw('ALTER TABLE tmp_hitl_messages RENAME TO hitl_messages')
    })

module.exports = {
  up: knex =>
    knex(table)
      .columnInfo('text')
      .then(async info => {
        if (info.maxLength !== '640') {
          return
        }
        if (knex.client.config.client === 'pg') {
          return knex.schema.alterTable(table, t => {
            t.string('text', 640).alter()
          })
        }
        return alertSQLTextString(knex, 640)
      }),

  down: knex =>
    knex(table)
      .columnInfo('text')
      .then(async info => {
        if (info.maxLength === '640') {
          return
        }
        if (knex.client.config.client === 'pg') {
          return knex.schema.alterTable(table, t => {
            t.string('text', 255).alter()
          })
        }
        return alertSQLTextString(knex, 255)
      })
}
