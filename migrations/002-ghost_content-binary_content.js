exports.up = knex =>
  knex.schema.table('ghost_content', t => {
    t.binary('binary_content')
  })

exports.down = knex =>
  knex.schema.table('ghost_content', t => {
    t.dropColumn('binary_content')
  })
