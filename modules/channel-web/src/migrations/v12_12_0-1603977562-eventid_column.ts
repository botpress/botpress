import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Adds eventId to web_messages',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasColumn('web_messages', 'eventId')) {
      return { success: true, message: 'Column eventId already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('web_messages', table => {
        table.string('eventId')
      })

      return { success: true, message: 'Column created successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
