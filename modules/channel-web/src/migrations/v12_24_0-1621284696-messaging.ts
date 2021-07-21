import * as sdk from 'botpress/sdk'
import { MessagingPostgresDownMigrator } from '../messaging-migration/down-pg'
import { MessagingSqliteDownMigrator } from '../messaging-migration/down-sqlite'
import { MessagingPostgresUpMigrator } from '../messaging-migration/up-pg'
import { MessagingSqliteUpMigrator } from '../messaging-migration/up-sqlite'

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Converts old tables to external messaging',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (
      !(await bp.database.schema.hasTable('web_conversations')) ||
      !(await bp.database.schema.hasTable('web_messages'))
    ) {
      return { success: true, message: 'Migration skipped' }
    }

    if (bp.database.isLite) {
      const migrator = new MessagingSqliteUpMigrator(bp)
      await migrator.run()
    } else {
      const migrator = new MessagingPostgresUpMigrator(bp)
      await migrator.run()
    }

    return { success: true, message: 'Tables migrated successfully' }
  },

  down: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (
      !(await bp.database.schema.hasTable('msg_conversations')) ||
      !(await bp.database.schema.hasTable('msg_messages'))
    ) {
      return { success: true, message: 'Migration skipped' }
    }

    if (bp.database.isLite) {
      const migrator = new MessagingSqliteDownMigrator(bp)
      await migrator.run()
    } else {
      const migrator = new MessagingPostgresDownMigrator(bp)
      await migrator.run()
    }

    return { success: true, message: 'Tables migrated successfully' }
  }
}

export default migration
