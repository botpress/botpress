/*
  A table storing all the interlocutors (users) and their information
*/

import helpers from './helpers'

module.exports = knex => {
  return helpers(knex).createTableIfNotExists('users', table => {
    table.string('id').primary()
    table.string('userId')
    table.string('platform')
    table.enu('gender', ['unknown', 'male', 'female'])
    table.integer('timezone')
    table.string('picture_url')
    table.string('first_name')
    table.string('last_name')
    table.string('locale')
    table.timestamp('created_on')
  })
}
