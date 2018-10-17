exports.up = knex =>
  knex.raw(`
    ALTER TABLE ghost_content DROP CONSTRAINT IF EXISTS ghost_content_folder_file_unique;
    ALTER TABLE ghost_content ADD CONSTRAINT ghost_content_folder_file_unique UNIQUE (folder, file);
  `)

exports.down = knex => knex.raw('ALTER TABLE ghost_content DROP CONSTRAINT IF EXISTS ghost_content_folder_file_unique;')
