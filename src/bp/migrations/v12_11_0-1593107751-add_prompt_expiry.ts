import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'

const migration: Migration = {
  info: {
    description: 'Add a new column for prompt expiry',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasColumn('dialog_sessions', 'prompt_expiry')) {
      return { success: true, message: 'Column prompt_expiry already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('dialog_sessions', table => {
        table.timestamp('prompt_expiry').nullable()
      })

      return { success: true, message: 'Field created successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
