import * as sdk from 'botpress/sdk'
import { MigrationOpts } from 'core/services/migration'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Add source column to hitl_messages',
    type: 'database'
  },
  up: async ({ bp, database, inversify }: MigrationOpts): Promise<sdk.MigrationResult> => {
    await bp.database.schema.alterTable('hitl_messages', table => table.string('source'))
    return { success: true, message: 'Source column created.' }
  }
}

export default migration
