import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Adds incomingEventId to the table web_messages',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasColumn('web_messages', 'incomingEventId')) {
      return { success: true, message: 'Column incomingEventId already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('web_messages', table => {
        table.string('incomingEventId')
      })

      return { success: true, message: 'Field created successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
