import * as sdk from 'botpress/sdk'
import { Migration } from '../migration-service'

const migration: Migration = {
  info: {
    description: '',
    target: 'core',
    type: 'config'
  },
  up: async ({
    bp,
    configProvider,
    database,
    inversify,
    metadata
  }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
