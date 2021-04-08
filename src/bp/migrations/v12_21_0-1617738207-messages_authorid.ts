import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Replace from column with authorId',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if ((await bp.database.schema.hasTable('messages')) && (await bp.database.schema.hasColumn('messages', 'from'))) {
      await bp.database.schema.alterTable('messages', table => {
        table.dropColumn('from')
        table.string('authorId')
      })
    }

    return {
      success: true,
      message: 'Updated messages table from -> authorId'
    }
  },
  down: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (
      (await bp.database.schema.hasTable('messages')) &&
      (await bp.database.schema.hasColumn('messages', 'authorId'))
    ) {
      await bp.database.schema.alterTable('messages', table => {
        table.dropColumn('authorId')
        table.string('from')
      })
    }

    return {
      success: true,
      message: 'Updated messages table authorId -> from'
    }
  }
}

export default migration
