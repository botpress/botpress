import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Remove migrations tables',
    type: 'database'
  },
  up: async ({ bp }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      if (await bp.database.schema.hasTable('knex_core_migrations')) {
        await bp.database.schema.dropTable('knex_core_migrations')
      }

      if (await bp.database.schema.hasTable('knex_core_migrations_lock')) {
        await bp.database.schema.dropTable('knex_core_migrations_lock')
      }
    } catch (err) {
      return { success: false, message: err.message }
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
