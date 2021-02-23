import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'

const migration: Migration = {
  info: {
    description: 'Add tokenVersion to strategy tables',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp, configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false
    const config = await configProvider.getBotpressConfig()

    for (const strategy of Object.keys(config.authStrategies)) {
      if (!(await bp.database.schema.hasColumn(`strategy_${strategy}`, 'tokenVersion'))) {
        await bp.database.schema.alterTable(`strategy_${strategy}`, table => {
          table
            .integer('tokenVersion')
            .notNullable()
            .defaultTo(1)
        })

        hasChanges = true
      }
    }

    return { success: true, message: hasChanges ? 'Field added successfully' : 'Field already exists, skipping...' }
  }
}

export default migration
