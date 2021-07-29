import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Adding eventCollector configuration to Botpress Config',
    type: 'config'
  },
  up: async ({ configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()
    if (config.eventCollector) {
      return { success: true, message: 'Event Collector configuration already exists, skipping...' }
    }

    await configProvider.mergeBotpressConfig({
      eventCollector: {
        enabled: true,
        collectionInterval: '5s',
        retentionPeriod: '30d',
        ignoredEventTypes: ['visit', 'typing']
      }
    })
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
