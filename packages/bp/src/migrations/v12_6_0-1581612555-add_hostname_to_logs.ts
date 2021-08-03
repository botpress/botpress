import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Adds server hostname to the logs table',
    type: 'database'
  },
  up: async ({ bp }: MigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasColumn('srv_logs', 'hostname')) {
      return { success: true, message: 'Column hostname already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('srv_logs', table => {
        table.string('hostname').nullable()
      })

      return { success: true, message: 'Field created successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
