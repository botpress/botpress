import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'

const migration: Migration = {
  info: {
    description: 'Add api key to strategy tables',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp, configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false
    const config = await configProvider.getBotpressConfig()

    for (const strategy of Object.keys(config.authStrategies)) {
      const tableName = `strategy_${strategy}`

      if (
        (await bp.database.schema.hasTable(tableName)) &&
        !(await bp.database.schema.hasColumn(tableName, 'apiKey'))
      ) {
        await bp.database.schema.alterTable(tableName, table => {
          table.string('apiKey')
        })

        hasChanges = true
      }
    }

    return {
      success: true,
      hasChanges,
      message: hasChanges ? 'Field added successfully' : 'Field already exists, skipping...'
    }
  },
  down: async ({ bp, configProvider }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false
    const config = await configProvider.getBotpressConfig()

    for (const strategy of Object.keys(config.authStrategies)) {
      if (await bp.database.schema.hasColumn(`strategy_${strategy}`, 'apiKey')) {
        await bp.database.schema.table(`strategy_${strategy}`, table => {
          table.dropColumn('apiKey')
        })

        hasChanges = true
      }
    }

    return {
      success: true,
      hasChanges,
      message: hasChanges ? 'Field removed successfully' : "Field doesn't exists, skipping..."
    }
  }
}

export default migration
