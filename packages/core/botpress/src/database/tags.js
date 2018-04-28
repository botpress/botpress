/*
  A table storing all the user tags
*/

import helpers from './helpers'

module.exports = knex => {
  return helpers(knex).createTableIfNotExists('users_tags', table => {
    table.string('userId')
    table.string('tag')
    table.string('value')
    table.timestamp('tagged_on')
    table.unique(['userId', 'tag'])
  })
}
