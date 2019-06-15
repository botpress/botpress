import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { Migration, MigrationType } from 'core/services/migration'

export const migration: Migration = {
  info: {
    description: 'Adding eventCollector configuration to Botpress Config',
    type: 'config' as MigrationType
  },
  up: async (bp: typeof sdk, configProvider: ConfigProvider) => {
    const config = await configProvider.getBotpressConfig()
    if (config.eventCollector) {
      return { success: `Event Collector configuration already exists, skipping...` }
    }

    await configProvider.mergeBotpressConfig({
      eventCollector: {
        enabled: true,
        collectionInterval: '5s',
        retentionPeriod: '30d',
        ignoredEventTypes: ['visit', 'typing']
      }
    })
    return { success: 'Configuration updated successfully' }
  }
}

export default migration
