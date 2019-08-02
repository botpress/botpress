import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Add source column to hitl_messages',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      await bp.database.schema.alterTable('hitl_messages', table => table.string('source'))
    } catch (err) {
      return { success: false, message: err.message }
    }

    return { success: true, message: 'Source column created.' }
  }
}

export default migration
