import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Add source column to hitl_messages',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      const tableName = 'hitl_messages'
      const column = 'source'
      const exists = await bp.database.schema.hasColumn(tableName, column)

      if (!exists) {
        await bp.database.schema.alterTable(tableName, table => table.string(column))
      } else {
        return { success: true, message: 'Source column already exists, skipping...' }
      }
    } catch (err) {
      return { success: false, message: err.message }
    }

    return { success: true, message: 'Source column created.' }
  }
}

export default migration
