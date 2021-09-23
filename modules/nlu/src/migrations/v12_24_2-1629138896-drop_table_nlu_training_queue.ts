import * as sdk from 'botpress/sdk'

const TABLE_NAME = 'nlu_training_queue'

const migration: sdk.ModuleMigration = {
  info: {
    description: '',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      await bp.database.schema.dropTable(TABLE_NAME)
      return { success: true, message: 'Migration ran successfully' }
    } catch (err) {
      return { success: false, message: `The following error occured when running the migration ${err.message}.` }
    }
  },
  down: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
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
