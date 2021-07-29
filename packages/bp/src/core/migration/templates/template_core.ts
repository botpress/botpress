import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: '',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider, database, inversify, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
