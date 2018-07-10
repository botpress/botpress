exports.up = knex =>
  knex.schema.table('users', t => {
    t.unique(['platform', 'userId'])
  })

exports.down = knex =>
  knex.schema.table('users', t => {
    t.dropUnique(['platform', 'userId'])
  })
