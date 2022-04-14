import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import { runMessagingMigration } from 'orchestrator/messaging-server'

const migration: Migration = {
  info: {
    description: 'Migrates the messaging database from 1.1.3 to 1.2.0',
    target: 'core',
    type: 'database'
  },

  up: async ({ metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    return runMessagingMigration('up', '1.2.0', metadata.isDryRun)
  },

  down: async ({ metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    return runMessagingMigration('down', '1.1.3', metadata.isDryRun)
  }
}

export default migration
