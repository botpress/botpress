/*
  Table storing the created content
*/

import helpers from './helpers'

module.exports = knex => {
  return helpers(knex).createTableIfNotExists('content_items', function (table) {
    table.string('id').primary()
    table.string('data')
    table.string('formData')
    table.string('metadata')
    table.string('categoryId')
    table.string('previewText')
    table.string('created_by')
    table.timestamp('created_on')
  })
}
