import * as sdk from 'botpress/sdk'

import { MODULE_NAME } from '../constants'

const migration: sdk.ModuleMigration = {
  info: {
    description: `Adds support for tags in ${MODULE_NAME} module`,
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
      message: exists ? 'Tags column already exists, skipping...' : 'Tags column created.'
    }
  }
}

export default migration
