/*
  Table storing the created content
*/

import helpers from './helpers'

module.exports = knex => {
  return helpers(knex).createTableIfNotExists('content_items', function(table) {
    table.string('id').primary()
    table.text('data')
    table.text('formData')
    table.text('metadata')
    table.string('categoryId')
    table.text('previewText')
    table.string('created_by')
    table.timestamp('created_on')
  })
}
