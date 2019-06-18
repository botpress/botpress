import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { Migration } from 'core/services/migration'
import { Container } from 'inversify'

const migration: Migration = {
  info: {
    description: '',
    type: 'config'
  },
  up: async (
    bp: typeof sdk,
    configProvider: ConfigProvider,
    database: Database,
    inversify: Container
  ): Promise<sdk.MigrationResult> => {
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
