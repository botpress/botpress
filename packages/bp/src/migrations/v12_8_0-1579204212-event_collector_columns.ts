import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Add workflowId columns to events table',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasColumn('events', 'workflowId')) {
      return { success: true, message: 'Column workflowId already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('events', table => {
        table.string('workflowId').nullable()
        table.integer('feedback').nullable()
        table.boolean('success').nullable()
      })

      return { success: true, message: 'Field created successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
