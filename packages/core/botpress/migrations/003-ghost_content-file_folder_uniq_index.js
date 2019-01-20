exports.up = knex => {
  if (knex.client.config.client === 'sqlite3') {
    return
  }
  return knex.raw(`
    ALTER TABLE ghost_content DROP CONSTRAINT IF EXISTS ghost_content_folder_file_unique;
    ALTER TABLE ghost_content ADD CONSTRAINT ghost_content_folder_file_unique UNIQUE (folder, file);
  `)
}

exports.down = knex =>
  knex.schema.alterTable('ghost_content', t => {
    t.dropUnique(['folder', 'file'])
  })
