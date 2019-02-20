import { DatabaseMigration } from '../interfaces'

/**
 * Necessary to force the Typescript Compiler to generate the migrations folder.
 * Empty folders and hidden files are ignored by the tsc.
 * This also doubles up as a migration template.
 */
export const migration: DatabaseMigration = {
  up: async knex => {},
  down: async knex => {}
}
