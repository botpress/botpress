/*
  Tables storing ghost content and its revisions
*/

import helpers from './helpers'

module.exports = knex => {
  const h = helpers(knex)
  return h
    .createTableIfNotExists('ghost_content', table => {
      table.increments('id')
      table.string('folder')
      table.string('file')
      table.text('content')
      table.timestamp('modified_on').defaultTo(knex.fn.now())
    })
    .then(() =>
      h.createTableIfNotExists('ghost_revisions', table => {
        table.increments('id')
        table.integer('content_id').references('ghost_content.id')
        table.string('revision')
        table.timestamp('created_on').defaultTo(knex.fn.now())
        table.string('created_by')
      })
    )
}
