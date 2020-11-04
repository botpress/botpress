import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Adds payload field to the table web_messages',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasColumn('web_messages', 'payload')) {
      return { success: true, message: 'Column payload already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('web_messages', table => {
        table.jsonb('payload')
      })

      return { success: true, message: 'Field created successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
