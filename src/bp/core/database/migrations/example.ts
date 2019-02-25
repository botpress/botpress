import Knex from 'knex'

/**
 * Necessary to force the Typescript Compiler to generate the migrations folder.
 * Empty folders and hidden files are ignored by the tsc.
 * This also doubles up as a migration template.
 */
export const up = async (knex: Knex): Promise<void> => {
  return
}
export const down = async (knex: Knex): Promise<void> => {
  return
}
