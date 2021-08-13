import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Add expireOn column to srv_kvs',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasColumn('srv_kvs', 'expireOn')) {
      return { success: true, message: 'Column expireOn already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('srv_kvs', table => {
        table.timestamp('expireOn').nullable()
      })

      return { success: true, message: 'Field created successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
