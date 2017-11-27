/*
  A table storing all notifications
*/

import helpers from './helpers'

module.exports = knex => {
  return helpers(knex).createTableIfNotExists('notifications', table => {
    table.string('id').unique()
    table.string('message')
    table.string('level')
    table.string('module_id')
    table.string('module_icon')
    table.string('module_name')
    table.string('redirect_url')

    table.timestamp('created_on')

    table.boolean('read')
    table.boolean('archived')
  })
}
