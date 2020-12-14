import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: '',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const tableName = 'handoffs'
    const column = 'tags'
    const exists = await bp.database.schema.hasColumn(tableName, column)

    if (!exists) {
      await bp.database.schema.alterTable(tableName, table => table.json(column))
    }

    return {
      success: true,
      message: exists ? 'tags column already exists, skipping...' : 'tags column created.'
    }
  }
}

export default migration
