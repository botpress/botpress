import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { Migration } from 'core/services/migration'
import { Container } from 'inversify'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Add the converse API default config',
    type: 'config'
  },
  up: async (
    bp: typeof sdk,
    configProvider: ConfigProvider,
    database: Database,
    inversify: Container
  ): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()
    const hasTimeout = _.get(config, 'converse.timeout')
    if (!hasTimeout) {
      return { success: true, message: 'Converse API config already set, skipping...' }
    }

    await configProvider.mergeBotpressConfig({
      converse: {
        timeout: '5s'
      }
    })

    return { success: true }
  }
}

export default migration
