import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import { runMessagingMigration } from 'orchestrator/messaging-server'

const migration: Migration = {
  info: {
    description: 'Migrates the messaging database from 0.1.21 to 1.0.4',
    target: 'core',
    type: 'database'
  },

  up: async ({ metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    return runMessagingMigration('up', '1.0.4', metadata.isDryRun)
  },

  down: async ({ metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    return runMessagingMigration('down', '0.1.21', metadata.isDryRun)
  }
}

export default migration
