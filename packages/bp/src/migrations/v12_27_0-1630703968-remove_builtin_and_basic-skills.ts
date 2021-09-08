import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Remove modules builtin and basic-skills',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false
    const modulesToDisable = ['builtin', 'basic-skills']
    const config = await configProvider.getBotpressConfig()

    for (const mod of modulesToDisable) {
      const entry = config.modules.find(x => x.location.endsWith(mod))

      if (entry) {
        entry.enabled = false
        hasChanges = true
      }
    }

    if (hasChanges) {
      await configProvider.setBotpressConfig(config)
    }

    return { success: true, message: 'Modules disabled successfully' }
  }
}

export default migration
