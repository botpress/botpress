import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Adds a messageId column to the events table',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const hasMessageIdColumn = await bp.database.schema.hasColumn('events', 'messageId')
    if (hasMessageIdColumn) {
      return { success: true, message: 'MessageId column already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('events', table => {
        table.uuid('messageId').nullable()
      })

      return { success: true, message: 'messageId column added successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  },
  down: async ({ bp }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const hasMessageIdColumn = await bp.database.schema.hasColumn('events', 'messageId')
    if (!hasMessageIdColumn) {
      return { success: true, message: 'MessageId column already removed, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('events', table => {
        table.dropColumn('messageId')
      })

      return { success: true, message: 'messageId column removed successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
