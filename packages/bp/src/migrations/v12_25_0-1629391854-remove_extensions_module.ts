import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Remove module extensions',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const config = await configProvider.getBotpressConfig()
    const entry = config.modules.find(x => x.location.endsWith('/extensions'))

    if (entry) {
      entry.enabled = false
      await configProvider.setBotpressConfig(config)
    }

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
