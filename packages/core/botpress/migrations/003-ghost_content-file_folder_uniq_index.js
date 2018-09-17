exports.up = knex =>
  knex.schema.alterTable('ghost_content', t => {
    t.unique(['folder', 'file'])
  })

exports.down = knex =>
  knex.schema.alterTable('ghost_content', t => {
    t.dropUnique(['folder', 'file'])
  })
