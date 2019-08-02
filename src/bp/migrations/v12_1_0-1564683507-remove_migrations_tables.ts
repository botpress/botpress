import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/services/migration'

const migration: Migration = {
  info: {
    description: 'Remove migrations tables',
    type: 'database'
  },
  up: async ({ bp }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      await bp.database.schema.dropTable('knex_core_migrations')
      await bp.database.schema.dropTable('knex_core_migrations_lock')
    } catch (err) {
      return { success: false, message: err.message }
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
