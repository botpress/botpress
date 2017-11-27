/*
  Table storing the created content
*/

import helpers from './helpers'

module.exports = knex =>
  helpers(knex).createTableIfNotExists('content_items', table => {
    table.string('id').primary()
    table.text('data')
    table.text('formData')
    table.text('metadata')
    table.string('categoryId')
    table.text('previewText')
    table.string('created_by')
    table.timestamp('created_on')
  })
