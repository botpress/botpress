exports.up = knex =>
  knex.schema.table('ghost_content', t => {
    t.boolean('deleted').defaultTo(0)
  })

exports.down = knex =>
  knex.schema.table('ghost_content', t => {
    t.dropColumn('deleted')
  })
