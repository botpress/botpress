/*
  Table storing bot logs
*/

import helpers from './helpers'

module.exports = knex => {
  const h = helpers(knex)
  return h.createTableIfNotExists('logs', table => {
    table.increments('id')
    table.string('level')
    table.text('message')
    table.timestamp('created_on')
  })
}
