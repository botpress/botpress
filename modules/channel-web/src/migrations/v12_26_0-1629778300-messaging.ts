import * as sdk from 'botpress/sdk'
import { MessagingPostgresDownMigrator } from '../messaging-migration/down-pg'
import { MessagingSqliteDownMigrator } from '../messaging-migration/down-sqlite'
import { MessagingPostgresUpMigrator } from '../messaging-migration/up-pg'
import { MessagingSqliteUpMigrator } from '../messaging-migration/up-sqlite'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Converts old tables to external messaging',
    type: 'database',
    canDryRun: true
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (
      !(await bp.database.schema.hasTable('web_conversations')) ||
      !(await bp.database.schema.hasTable('web_messages'))
    ) {
      return { success: true, message: 'Migration skipped' }
    }

    let message = undefined

    if (bp.database.isLite) {
      if (metadata.isDryRun) {
        return { success: true, message: 'Skipped. Dry run not supported on sqlite for this migration' }
      }

      const migrator = new MessagingSqliteUpMigrator(bp, false)
      message = await migrator.run()
    } else {
      const migrator = process.env.MIG_MESSAGING_FAST
        ? new MessagingPostgresUpMigrator(bp, metadata.isDryRun)
        : new MessagingSqliteUpMigrator(bp, metadata.isDryRun)
      message = await migrator.run()
    }

    return { success: true, message: 'Tables migrated successfully' + message }
  },

  down: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (
      !(await bp.database.schema.hasTable('msg_conversations')) ||
      !(await bp.database.schema.hasTable('msg_messages'))
    ) {
      return { success: true, message: 'Migration skipped' }
    }

    let message = undefined

    if (bp.database.isLite) {
      if (metadata.isDryRun) {
        return { success: true, message: 'Skipped. Dry run not supported on sqlite for this migration' }
      }

      const migrator = new MessagingSqliteDownMigrator(bp, false)
      message = await migrator.run()
    } else {
      const migrator = process.env.MIG_MESSAGING_FAST
        ? new MessagingPostgresDownMigrator(bp, metadata.isDryRun)
        : new MessagingSqliteDownMigrator(bp, metadata.isDryRun)
      message = await migrator.run()
    }

    return { success: true, message: 'Tables migrated successfully' + message }
  }
}

export default migration
