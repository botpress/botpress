import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Updates the mapping table',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    // This wasn't in use anywhere so we can just delete the old table
    if (await bp.database.schema.hasTable('mapping')) {
      await bp.database.schema.dropTable('mapping')

      await bp.database.createTableIfNotExists('mapping', table => {
        table.string('scope')
        table.uuid('local')
        table.string('foreign')
        table.primary(['scope', 'local', 'foreign'])
        table.unique(['scope', 'local'])
        table.unique(['scope', 'foreign'])
      })
    }
    return { success: true, message: 'Mapping table updated' }
  }
}

export default migration
