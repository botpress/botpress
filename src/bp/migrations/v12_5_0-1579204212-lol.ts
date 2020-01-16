import * as sdk from 'botpress/sdk'

const migration: sdk.ModuleMigration = {
  info: {
    description: `Add goal columns to events table`,
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    if (await bp.database.schema.hasColumn('events', 'goalId')) {
      return { success: true, message: 'Column goalId already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('events', table => {
        table.string('goalId').nullable()

        table
          .integer('feedback')
          .notNullable()
          .defaultTo(0)

        table.boolean('success').nullable()
      })

      return { success: true, message: 'Field created successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}

export default migration
