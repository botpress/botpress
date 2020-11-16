import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Add thread_id column to hitl_sessions',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      const tableName = 'hitl_sessions'
      const column = 'thread_id'
      const exists = await bp.database.schema.hasColumn(tableName, column)

      if (!exists) {
        await bp.database.schema.alterTable(tableName, table => table.string(column))
      }

      return {
        success: true,
        message: exists ? 'thread_id column already exists, skipping...' : 'thread_id column created.'
      }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }
}

export default migration
