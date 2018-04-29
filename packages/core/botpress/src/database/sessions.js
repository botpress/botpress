/*
  Table storing the current dialog sessions
*/

import helpers from './helpers'

module.exports = knex =>
  helpers(knex).createTableIfNotExists('dialog_sessions', table => {
    table.string('id').primary() // Usually the user id, channel id, etc..
    table.string('namespace') // Could be used for A/B testing
    table.text('state')
    table.timestamp('created_on').defaultTo(knex.fn.now())
    table.timestamp('active_on')
  })
