import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Adding actionServers configuration to Botpress Config',
    target: 'core',
    type: 'config'
  },
  up: async ({ configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()
    if (config.actionServers) {
      return { success: true, message: 'Action Servers configuration already exists, skipping...' }
    }

    await configProvider.mergeBotpressConfig({
      actionServers: {
        local: {
          port: 4000,
          enabled: true
        },
        remotes: []
      }
    })
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
