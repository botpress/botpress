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
      const tableName = `strategy_${strategy}`

      if (
        (await bp.database.schema.hasTable(tableName)) &&
        !(await bp.database.schema.hasColumn(tableName, 'tokenVersion'))
      ) {
        await bp.database.schema.alterTable(tableName, table => {
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
