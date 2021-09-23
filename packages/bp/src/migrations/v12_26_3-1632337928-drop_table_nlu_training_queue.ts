import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const TABLE_NAME = 'nlu_training_queue'

const migration: Migration = {
  info: {
    description: '',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      const tableExists = await bp.database.schema.hasTable(TABLE_NAME)
      if (!tableExists) {
        return { success: true, message: 'No need to run migration as table does not exist.' }
      }
      await bp.database.schema.dropTable(TABLE_NAME)
      return { success: true, message: 'Migration ran successfully' }
    } catch (err) {
      return { success: false, message: `The following error occured when running the migration ${err.message}.` }
    }
  },
  down: async ({ bp, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      await bp.database.createTableIfNotExists(TABLE_NAME, table => {
        table.string('botId').notNullable()
        table.string('language').notNullable()
        table.string('status').notNullable()
        table.string('owner').nullable()
        table.float('progress').notNullable()
        table.timestamp('modifiedOn').notNullable()
        table.primary(['botId', 'language'])
      })
      return { success: true, message: 'Migration ran successfully' }
    } catch (err) {
      return { success: false, message: `The following error occured when running the migration ${err.message}.` }
    }
  }
}

export default migration
