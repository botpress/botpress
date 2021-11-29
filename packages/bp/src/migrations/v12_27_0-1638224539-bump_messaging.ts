import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Migrates the messaging database from 0.1.18 to 0.1.19',
    target: 'core',
    type: 'database'
  },

  up: async ({}: MigrationOpts): Promise<sdk.MigrationResult> => {
    return { success: true, message: 'Configuration updated successfully' }
  },

  down: async ({}: MigrationOpts): Promise<sdk.MigrationResult> => {
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
